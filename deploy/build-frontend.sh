#!/bin/bash
# ============================================================
# Local Ledger 前端构建脚本
# 技术栈：React 18 + Vite 5 + Ant Design 5
# 产物：dist/ 静态文件目录
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
FRONTEND_DIR="$PROJECT_ROOT/frontend"
OUTPUT_DIR="$SCRIPT_DIR/output/frontend"

# ---------- 可选参数 ----------
SKIP_INSTALL=false
CLEAN_ONLY=false
API_BASE_URL=""

usage() {
    echo -e "${CYAN}用法:${NC} $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -s, --skip-install       跳过 npm install（依赖未变更时）"
    echo "  -a, --api-url URL        指定后端 API 地址（用于生产构建）"
    echo "  -c, --clean              仅清理构建产物"
    echo "  -h, --help               显示帮助信息"
    echo ""
    echo "示例:"
    echo "  $0                                # 完整构建"
    echo "  $0 -s                             # 跳过依赖安装快速构建"
    echo "  $0 -a http://api.example.com      # 指定 API 地址"
    echo "  $0 -c                             # 仅清理"
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        -s|--skip-install)
            SKIP_INSTALL=true
            shift
            ;;
        -a|--api-url)
            API_BASE_URL="$2"
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
    log_step "清理前端构建产物..."
    rm -rf "$OUTPUT_DIR"
    rm -rf "$FRONTEND_DIR/dist"
    log_info "清理完成"
    exit 0
fi

echo ""
echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}  Local Ledger 前端构建${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

# ---------- Step 1: 环境检查 ----------
log_step "Step 1/5 - 环境检查"

# 检查 Node.js
if ! command -v node &> /dev/null; then
    log_error "未找到 Node.js，请安装 Node.js 18 或更高版本"
    exit 1
fi

NODE_VERSION=$(node -v | sed 's/v//' | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ] 2>/dev/null; then
    log_error "Node.js 版本需要 18 或更高，当前: $(node -v)"
    exit 1
fi
log_info "Node.js 版本: $(node -v)"

# 检查 npm
if ! command -v npm &> /dev/null; then
    log_error "未找到 npm"
    exit 1
fi
log_info "npm 版本: $(npm -v)"

# 检查前端目录
if [ ! -f "$FRONTEND_DIR/package.json" ]; then
    log_error "未找到 package.json: $FRONTEND_DIR/package.json"
    exit 1
fi
log_info "项目根目录: $PROJECT_ROOT"

# ---------- Step 2: 安装依赖 ----------
log_step "Step 2/5 - 安装依赖"

cd "$FRONTEND_DIR"

if [ "$SKIP_INSTALL" = true ]; then
    if [ ! -d "node_modules" ]; then
        log_warn "node_modules 不存在，将自动安装依赖"
        npm ci --silent
    else
        log_warn "已跳过依赖安装"
    fi
else
    log_info "执行: npm ci"
    npm ci --silent
fi

# ---------- Step 3: Vite 构建 ----------
log_step "Step 3/5 - Vite 构建"

# 如果指定了 API 地址，通过环境变量传入
if [ -n "$API_BASE_URL" ]; then
    log_info "API 地址: $API_BASE_URL"
    VITE_API_BASE_URL="$API_BASE_URL" npm run build
else
    npm run build
fi

# 检查构建产物
if [ ! -d "$FRONTEND_DIR/dist" ]; then
    log_error "构建产物目录不存在: $FRONTEND_DIR/dist"
    exit 1
fi

# ---------- Step 4: 复制到输出目录 ----------
log_step "Step 4/5 - 复制构建产物"

rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"
cp -r "$FRONTEND_DIR/dist/"* "$OUTPUT_DIR/"

# 统计产物信息
FILE_COUNT=$(find "$OUTPUT_DIR" -type f | wc -l | tr -d ' ')
TOTAL_SIZE=$(du -sh "$OUTPUT_DIR" | cut -f1)

# ---------- Step 5: 打包压缩 ----------
log_step "Step 5/5 - 打包压缩"

PACKAGE_DIR="$SCRIPT_DIR/output"
TIMESTAMP=$(date +%Y%m%d%H%M%S)
ARCHIVE_NAME="local-ledger-frontend-${TIMESTAMP}"

cd "$PACKAGE_DIR"

# 打包为 tar.gz
tar -czf "${ARCHIVE_NAME}.tar.gz" -C "$PACKAGE_DIR" frontend/
TAR_SIZE=$(du -h "${ARCHIVE_NAME}.tar.gz" | cut -f1)
log_info "TAR 包: ${ARCHIVE_NAME}.tar.gz ($TAR_SIZE)"

# 打包为 zip
zip -rq "${ARCHIVE_NAME}.zip" frontend/
ZIP_SIZE=$(du -h "${ARCHIVE_NAME}.zip" | cut -f1)
log_info "ZIP 包: ${ARCHIVE_NAME}.zip ($ZIP_SIZE)"

# ---------- 完成 ----------
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  前端构建成功！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
log_info "产物目录: $OUTPUT_DIR"
log_info "文件数量: $FILE_COUNT"
log_info "总大小:   $TOTAL_SIZE"
log_info "TAR 包:   $PACKAGE_DIR/${ARCHIVE_NAME}.tar.gz ($TAR_SIZE)"
log_info "ZIP 包:   $PACKAGE_DIR/${ARCHIVE_NAME}.zip ($ZIP_SIZE)"
echo ""
log_info "部署方式:"
echo "  将 $OUTPUT_DIR 目录下的文件部署到 Web 服务器（Nginx/Apache 等）"
echo "  或直接使用压缩包分发"
echo ""
log_info "本地预览:"
echo "  cd $FRONTEND_DIR && npm run preview"
echo ""
