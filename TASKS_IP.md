# IP 代理地址管理与钱包关联

目标  
- 为每个钱包配置并持久化 IP 代理信息（ipName + ipEndpoint）。

当前问题  
- 代理配置流程/入口不够清晰，钱包关联逻辑未完整闭环。

必须做到  
- 钱包行内配置 IP（不新增独立 IP 列表页）。  
- 每个钱包保存 `ipName` 和 `ipEndpoint`，导入/导出/加密存储保持一致。  
- 配置后能在钱包列表/工作台等相关位置展示。  
- IP 查询后的记录支持“保留/清空”，提供明确的删除按钮或清空入口。  
- 需要支持“服务器删除单行配置”（后续对接 API）。  

验收标准  
- 任意钱包设置 IP 后刷新页面仍能恢复。  
- 导入/导出钱包文件后 IP 关联不丢失。  
- 行级配置入口可用，配置后 UI 立即更新。  
- 查询结果可一键清空，避免历史记录干扰。  
- 单行删除按钮已预留或可对接服务器删除接口。  

接口需求（后端实现，动作式定义）  
- 查询 Owner 配置列表：POST `/proxy/configs/query`  
- 同步 Owner 钱包列表：POST `/proxy/configs/sync-owner-wallets`  
- 更新单钱包代理：POST `/proxy/wallets/update`  
- 删除单钱包代理：POST `/proxy/wallets/remove`  
- 批量同步本地配置：POST `/proxy/wallets/batch-sync`（如不做批量，可逐条调用 update）  

涉及文件  
- src/components/WalletIpModal.vue  
- src/services/walletIpCache.ts  
- src/services/walletVault.ts  
- src/pages/WalletsPage.vue  
- src/pages/SingleWorkbenchPage.vue  
- src/App.vue  
