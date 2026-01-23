#!/bin/bash
# Art Share 部署脚本

case "$1" in
    start)
        echo "🚀 启动服务..."
        docker-compose up -d --build
        echo "✅ 服务已启动: http://localhost:3000"
        ;;
    stop)
        echo "⏹️ 停止服务..."
        docker-compose down
        ;;
    logs)
        docker-compose logs -f
        ;;
    restart)
        docker-compose restart
        ;;
    backup)
        BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
        mkdir -p "$BACKUP_DIR"
        cp -r ./data ./uploads "$BACKUP_DIR/" 2>/dev/null || true
        echo "✅ 备份完成: $BACKUP_DIR"
        ;;
    *)
        echo "用法: ./deploy.sh [start|stop|logs|restart|backup]"
        ;;
esac
