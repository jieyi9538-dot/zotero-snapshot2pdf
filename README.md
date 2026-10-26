# snapshot2pdf

一个 Zotero 插件：在条目右键菜单里加 **「快照转PDF」**，把网页快照（HTML）按需转成 PDF 附件。

- 只转换你选中的条目，不扫描全库；
- 已有 PDF 的条目自动跳过；
- 转好的 PDF 作为子附件挂回条目，Zotero 会自动索引，论文阅读/翻译类插件可直接使用；
- 零外部依赖：只需要系统里装着 Edge 或 Chrome（用于无头渲染）。

## 安装

1. 从 [Releases](https://github.com/jieyi9538-dot/zotero-snapshot2pdf/releases) 下载 `snapshot2pdf.xpi`；
2. Zotero → 工具 → 插件 → 齿轮 → **Install Plugin From File…**；
3. 选中 `.xpi`，重启 Zotero。

## 使用

在 Zotero 中选中一个或多个条目 → 右键 → **「快照转PDF」**。

弹窗会显示：`成功 X｜已有PDF Y｜无快照 Z｜失败 W`。

## 兼容性

- Zotero 7 / 8 / 9 / 10（`strict_min_version` 7.0，`strict_max_version` 10.*）；
- Windows 下自动查找 Edge / Chrome；其他平台需自行修改 `findEdge()`。

## 原理

1. 从选中条目里找 `text/html` 快照附件；
2. 调用 `msedge --headless --print-to-pdf` 渲染成 PDF；
3. `Zotero.Attachments.importFromFile()` 把 PDF 挂到父条目。

## 开发

```powershell
# 打包
powershell -ExecutionPolicy Bypass -File .\build.ps1
# 产物在 dist/snapshot2pdf.xpi
```

仓库结构：

```
manifest.json          # 插件清单（id / 版本 / 兼容范围 / 更新地址）
bootstrap.js           # 插件逻辑
build.ps1              # 打包脚本
update.json            # 自动更新清单（发版后更新）
```

## 已知限制

- 网页快照的排版就是网页排版，可能带站点导航栏、懒加载图片缺失；
- 付费文章的完整 PDF 建议用机构网络直接下载，而不是转快照；
- 转换时会短暂启动一个无头浏览器进程。

## License

MIT
