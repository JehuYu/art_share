#!/bin/bash

# Art Share 部署脚本
# 使用方法: ./deploy.sh [dev|prod|stop|logs|backup]

set -e

COMPOSE_FILE="docker-compose.yml"
PROD_COMPOSE_FILE="docker-compose.prod.yml"

# 颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 开发环境
dev() {
    log_info "启动开发环境..."
    docker-compose -f $COMPOSE_FILE up -d --build
    log_info "开发环境已启动: http://localhost:3000"
}

# 生产环境
prod() {
    log_info "启动生产环境..."
    
    # 检查 .env 文件
    if [ ! -f .env ]; then
        log_warn ".env 文件不存在，从示例创建..."
        cp .env.example .env
        log_warn "请编辑 .env 文件配置环境变量"
    fi
    
    docker-compose -f $PROD_COMPOSE_FILE up -d --build
    log_info "生产环境已启动: http://localhost:3000"
}

# 停止服务
stop() {
    log_info "停止服务..."
    docker-compose -f $COMPOSE_FILE down 2>/dev/null || true
    docker-compose -f $PROD_COMPOSE_FILE down 2>/dev/null || true
    log_info "服务已停止"
}

# 查看日志
logs() {
    if [ -f $PROD_COMPOSE_FILE ]; then
        docker-compose -f $PROD_COMPOSE_FILE logs -f
    else
        docker-compose -f $COMPOSE_FILE logs -f
    fi
}

# 备份
backup() {
    BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p $BACKUP_DIR
    
    log_info "备份到 $BACKUP_DIR ..."
    
    # 备份数据库
    if [ -f ./dev.db ]; then
        cp ./dev.db $BACKUP_DIR/
        log_info "数据库已备份"
    fi
    
    # 备份上传文件
    if [ -d ./public/uploads ]; then
        cp -r ./public/uploads $BACKUP_DIR/
        log_info "上传文件已备份"
    fi
    
    log_info "备份完成: $BACKUP_DIR"
}

# 帮助
help() {
    echo "Art Share 部署脚本"
    echo ""
    echo "用法: ./deploy.sh [命令]"
    echo ""
    echo "命令:"
    echo "  dev     启动开发环境"
    echo "  prod    启动生产环境"
    echo "  stop    停止所有服务"
    echo "  logs    查看日志"
    echo "  backup  备份数据"
    echo "  help    显示帮助"
}

# 主入口
case "$1" in
    dev)
        dev
        ;;
    prod)
        prod
        ;;
    stop)
        stop
        ;;
    logs)
        logs
        ;;
    backup)
        backup
        ;;
    help|--help|-h)
        help
        ;;
    *)
        log_error "未知命令: $1"
        help
        exit 1
        ;;
esac
