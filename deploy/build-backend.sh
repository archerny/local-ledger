#!/bin/bash
# ============================================================
# Local Ledger 后端构建脚本
# 技术栈：Spring Boot 3.2.0 + Java 17 + Maven
# 产物：backend-1.0.0.jar
# ============================================================

set -e

# ---------- 颜色定义 ----------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ---------- 路径定义 ----------
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
OUTPUT_DIR="$SCRIPT_DIR/output/backend"
JAR_NAME="backend-1.0.0.jar"

# ---------- 可选参数 ----------
SKIP_TESTS=false
CLEAN_ONLY=false
PROFILE="local"

usage() {
    echo -e "${CYAN}用法:${NC} $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -s, --skip-tests     跳过单元测试（默认不跳过）"
    echo "  -p, --profile NAME   指定 Spring Boot Profile（默认: local）"
    echo "  -c, --clean          仅清理构建产物"
    echo "  -h, --help           显示帮助信息"
    echo ""
    echo "示例:"
    echo "  $0                       # 完整构建（含测试）"
    echo "  $0 -s                    # 跳过测试快速构建"
    echo "  $0 -p prod               # 使用 prod profile 构建"
    echo "  $0 -c                    # 仅清理"
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        -s|--skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        -p|--profile)
            PROFILE="$2"
            shift 2
            ;;
        -c|--clean)
            CLEAN_ONLY=true
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            echo -e "${RED}错误: 未知参数 $1${NC}"
            usage
            exit 1
            ;;
    esac
done

log_info()  { echo -e "${GREEN}[INFO]${NC}  $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step()  { echo -e "${CYAN}[STEP]${NC}  $1"; }

# ---------- 清理 ----------
if [ "$CLEAN_ONLY" = true ]; then
    log_step "清理后端构建产物..."
    rm -rf "$OUTPUT_DIR"
    (cd "$BACKEND_DIR" && mvn clean -q)
    log_info "清理完成"
    exit 0
fi

echo ""
echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}  Local Ledger 后端构建${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

# ---------- Step 1: 环境检查 ----------
log_step "Step 1/5 - 环境检查"

# 检查 Java
if ! command -v java &> /dev/null; then
    log_error "未找到 Java，请安装 JDK 17 或更高版本"
    exit 1
fi

JAVA_VERSION=$(java -version 2>&1 | head -1 | awk -F '"' '{print $2}' | cut -d'.' -f1)
if [ "$JAVA_VERSION" -lt 17 ] 2>/dev/null; then
    log_error "Java 版本需要 17 或更高，当前: $(java -version 2>&1 | head -1)"
    exit 1
fi
log_info "Java 版本: $(java -version 2>&1 | head -1)"

# 检查 Maven
if ! command -v mvn &> /dev/null; then
    log_error "未找到 Maven，请安装 Maven 3.6+"
    exit 1
fi
log_info "Maven 版本: $(mvn -version 2>&1 | head -1)"

# 检查后端目录
if [ ! -f "$BACKEND_DIR/pom.xml" ]; then
    log_error "未找到 pom.xml: $BACKEND_DIR/pom.xml"
    exit 1
fi
log_info "项目根目录: $PROJECT_ROOT"

# ---------- Step 2: Maven 构建 ----------
log_step "Step 2/5 - Maven 构建"

cd "$BACKEND_DIR"

MVN_ARGS="clean package"
if [ "$SKIP_TESTS" = true ]; then
    MVN_ARGS="$MVN_ARGS -DskipTests"
    log_warn "已跳过单元测试"
fi

log_info "执行: mvn $MVN_ARGS"
mvn $MVN_ARGS

# ---------- Step 3: 检查产物 ----------
log_step "Step 3/5 - 检查构建产物"

JAR_PATH="$BACKEND_DIR/target/$JAR_NAME"
if [ ! -f "$JAR_PATH" ]; then
    log_error "构建产物不存在: $JAR_PATH"
    exit 1
fi

JAR_SIZE=$(du -h "$JAR_PATH" | cut -f1)
log_info "JAR 文件: $JAR_NAME ($JAR_SIZE)"

# ---------- Step 4: 复制到输出目录 ----------
log_step "Step 4/5 - 复制构建产物"

mkdir -p "$OUTPUT_DIR"
cp "$JAR_PATH" "$OUTPUT_DIR/"

# 生成启动脚本
cat > "$OUTPUT_DIR/start.sh" << 'STARTUP_EOF'
#!/bin/bash
# Local Ledger 后端启动脚本
# 用法: ./start.sh [profile]
#   profile: Spring Boot Profile 名称（默认: local）

PROFILE="${1:-local}"
JAR_NAME="backend-1.0.0.jar"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "启动 Local Ledger 后端服务..."
echo "  Profile: $PROFILE"
echo "  JAR:     $JAR_NAME"
echo ""

java -jar "$SCRIPT_DIR/$JAR_NAME" --spring.profiles.active="$PROFILE"
STARTUP_EOF
chmod +x "$OUTPUT_DIR/start.sh"

# ---------- Step 5: 打包压缩 ----------
log_step "Step 5/5 - 打包压缩"

PACKAGE_DIR="$SCRIPT_DIR/output"
TIMESTAMP=$(date +%Y%m%d%H%M%S)
ARCHIVE_NAME="local-ledger-backend-${TIMESTAMP}"

cd "$PACKAGE_DIR"

# 打包为 tar.gz
tar -czf "${ARCHIVE_NAME}.tar.gz" -C "$PACKAGE_DIR" backend/
TAR_SIZE=$(du -h "${ARCHIVE_NAME}.tar.gz" | cut -f1)
log_info "TAR 包: ${ARCHIVE_NAME}.tar.gz ($TAR_SIZE)"

# 打包为 zip
zip -rq "${ARCHIVE_NAME}.zip" backend/
ZIP_SIZE=$(du -h "${ARCHIVE_NAME}.zip" | cut -f1)
log_info "ZIP 包: ${ARCHIVE_NAME}.zip ($ZIP_SIZE)"

# ---------- 完成 ----------
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  后端构建成功！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
log_info "产物目录: $OUTPUT_DIR"
log_info "JAR 文件: $OUTPUT_DIR/$JAR_NAME ($JAR_SIZE)"
log_info "启动脚本: $OUTPUT_DIR/start.sh"
log_info "TAR 包:   $PACKAGE_DIR/${ARCHIVE_NAME}.tar.gz ($TAR_SIZE)"
log_info "ZIP 包:   $PACKAGE_DIR/${ARCHIVE_NAME}.zip ($ZIP_SIZE)"
echo ""
log_info "启动方式:"
echo "  cd $OUTPUT_DIR"
echo "  ./start.sh              # 使用 local profile"
echo "  ./start.sh prod         # 使用 prod profile"
echo ""
