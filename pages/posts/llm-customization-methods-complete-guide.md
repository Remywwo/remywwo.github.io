---
title: 大模型定制专家：方法全景与实战指南
date: 2026-06-10T21:11:00
lang: zh
type: blog
description: 系统梳理当前可用的8种大模型定制方法，从Prompt Engineering到预训练微调，结合成本、效果、适用场景给出清晰的选型指南。
---

[[toc]]

> 探索让大模型成为专业场景"领域专家"的所有路径

---

*📝 本文由虾幂整理自对主流大模型定制化方法的研究与实践总结。如有疏漏，欢迎指正。*

---

## 写在前面

随着大模型技术日趋成熟，越来越多的产品开始思考：**如何让通用大模型成为某个垂直领域的"专家"？**

无论是医疗诊断、法律咨询、企业知识库，还是出行助手、IoT 智能家居，让 AI 真正"懂行"是产品差异化的关键。

本文系统梳理当前可用的 **8 种主要方法**，从最简单的 Prompt Engineering 到复杂的预训练微调，结合成本、效果、适用场景给出清晰的选型指南。

---

## 一、整体方法对比

| 方法 | 成本 | 训练数据需求 | 效果上限 | 适合场景 | 技术门槛 |
|---|---|---|---|---|---|
| Prompt Engineering | 💰 | 0 条 | ⭐⭐ | 简单任务、临时方案 | 低 |
| RAG（检索增强生成） | 💰 | 文档库 | ⭐⭐⭐ | 知识密集型、需要溯源 | 中 |
| Few-shot Learning | 💰 | 10-100 条 | ⭐⭐ | 任务格式固定 | 低 |
| LoRA / QLoRA 微调 | 💰💰 | 1k-10k 条 | ⭐⭐⭐⭐ | 风格/任务定制 | 中 |
| 全量微调 | 💰💰💰💰 | 10k+ 条 | ⭐⭐⭐⭐⭐ | 深度领域适配 | 高 |
| RLHF / DPO 对齐 | 💰💰💰 | 偏好数据 | ⭐⭐⭐⭐⭐ | 对齐、安全、风格 | 高 |
| 预训练 + SFT | 💰💰💰 | 10k-100k 条 | ⭐⭐⭐⭐⭐ | 全新领域 | 极高 |
| Agent + Tools | 💰 | 工具/API | ⭐⭐⭐⭐ | 复杂任务链 | 中 |

**核心原则**：**从最简单的方法开始，逐步升级**。大多数场景下，RAG + Prompt 就能解决 80% 的问题。

---

## 二、8 种方法详解

### 1. Prompt Engineering（提示工程）

**核心思想**：不改变模型参数，只通过设计输入提示引导模型行为。

**常用技术**：

- **Zero-shot**：直接提问
- **Few-shot**：在 prompt 中给几个示例
- **Chain-of-Thought (CoT)**：让模型一步步推理
- **ReAct**：推理 + 行动交替
- **Self-Consistency**：多次采样取多数
- **Tree of Thoughts**：思维树搜索
- **System Prompt**：设定角色、规则、输出格式

**实战示例**：

```
你是一位资深的[领域]专家，拥有10年经验。
请用以下格式回答：
- 分析：
- 建议：
- 风险点：

问题：...
```

**优势**：
- 零成本，即刻生效
- 不需要训练
- 调试灵活

**局限**：
- 无法注入新知识
- 复杂任务效果有限
- Token 消耗大

**适用场景**：MVP 验证、简单任务、合规限制不允许动模型的场景。

---

### 2. RAG（检索增强生成）

**核心思想**：把外部知识库检索结果注入 Prompt，让模型基于最新/私有信息回答。

**架构流程**：

```
用户问题
 ↓
Query 理解 / Query 改写
 ↓
检索（向量检索 / 关键词检索 / 混合检索）
 ↓
Top-K 文档块
 ↓
Prompt 拼接（System + Context + Question）
 ↓
LLM 生成答案
```

**关键组件**：

- **Embedding 模型**：BGE、M3E、OpenAI Embedding
- **向量数据库**：Milvus、Qdrant、Weaviate、Chroma、pgvector
- **文档分块策略**：固定窗口、语义分块、层次分块
- **重排序 (Rerank)**：BGE Reranker、Cohere Rerank

**RAG 的四代演进**：

| 阶段 | 特点 |
|---|---|
| Naive RAG | 基础检索 + 拼接 |
| Advanced RAG | Query 改写 + 重排序 + HyDE |
| Modular RAG | 模块化组合 |
| GraphRAG | 基于知识图谱的检索（Microsoft） |
| Agentic RAG | Agent 自主决定何时检索、如何检索 |

**优势**：
- 知识更新快（更新文档即可）
- 可溯源（带引用）
- 幻觉少
- 不需要训练

**局限**：
- 上下文窗口限制
- 检索质量决定上限
- 复杂推理仍需模型能力

**推荐框架**：LangChain、LlamaIndex、Haystack、Dify、FastGPT、Qanything

**适用场景**：企业知识库问答、文档助手、需要引用来源、数据隐私要求高的场景。

---

### 3. Few-shot / In-context Learning

**核心思想**：在 Prompt 中给出少量示例，让模型"举一反三"。

**示例**：

```text
将以下句子翻译为英文：
示例1：
中文：我爱编程
英文：I love programming

示例2：
中文：今天天气很好
英文：The weather is nice today

请翻译：
中文：明天有会议
英文：
```

**优势**：
- 几乎零成本
- 适合任务格式固定
- 快速验证

**局限**：
- 受上下文窗口限制
- 示例质量决定效果
- 复杂任务效果有限

**适用场景**：任务格式标准化、分类、提取等结构化任务。

---

### 4. LoRA / QLoRA 微调

**核心思想**：冻结预训练模型权重，只训练低秩适配矩阵。

**LoRA 公式**：

```
W' = W + ΔW = W + (A × B)
```

- W：原始冻结权重
- A (d × r)、B (r × d)：可训练低秩矩阵
- r (rank)：超参数（4、8、16、64、128）

**QLoRA 的三大创新**：

- **4-bit 量化**（NF4）加载基础模型
- **双重量化**：量化常量也量化
- **分页优化器**：防止显存峰值

> QLoRA 可以在单张 24GB 显卡上微调 65B 模型。

**代码示例**：

```python
from peft import LoraConfig, get_peft_model
from transformers import AutoModelForCausalLM

model = AutoModelForCausalLM.from_pretrained("Qwen/Qwen2.5-7B")
config = LoraConfig(
    r=16,  # rank
    lora_alpha=32,  # 缩放因子
    target_modules=["q_proj", "v_proj"],
    lora_dropout=0.05,
    bias="none",
    task_type="CAUSAL_LM"
)
model = get_peft_model(model, config)
```

**数据格式**（Alpaca 风格）：

```json
{
    "instruction": "用一句话解释牛顿第二定律",
    "input": "",
    "output": "物体加速度与所受合外力成正比，与质量成反比。"
}
```

**训练框架对比**：

| 框架 | 特点 |
|---|---|
| HuggingFace PEFT | 最主流，原生支持 |
| LLaMA-Factory | 中文友好、开箱即用 |
| Axolotl | 配置化训练 |
| Unsloth | 速度优化（2-5x 加速）|
| MS-Swift | 魔搭社区出品 |

**优势**：
- 训练成本低（显存、算力、时间）
- 可插拔（多个 LoRA 切换）
- 不破坏原模型能力

**局限**：
- 效果不如全量微调
- 仍需要一定数据（1k+ 条）

**适用场景**：风格定制、任务格式学习、垂直领域轻量适配、资源有限场景。

---

### 5. 全量微调 (Full Fine-tuning)

**核心思想**：解冻所有参数，用领域数据继续训练。

**硬件要求**：

| 模型规模 | 显存需求 | 推荐配置 |
|---|---|---|
| 7B | 60-80GB | 1-2 张 A100/H100 |
| 13B | 120-160GB | 2-4 张 A100 |
| 70B | 280GB+ | 8 张 H100 |

**关键训练技巧**：

- **DeepSpeed ZeRO**（ZeRO-1/2/3）：分片优化器状态、梯度、参数
- **FSDP**（Fully Sharded Data Parallel）：PyTorch 原生
- **混合精度**（bf16/fp16）
- **梯度累积**（gradient accumulation）
- **学习率调度**：warmup + cosine
- **Flash Attention 2**：加速注意力计算

**数据准备**：
- 指令数据（instruction-response pairs）
- 领域文本（医学论文、法律文书等）
- 多轮对话数据

**代表案例**：
- **BloombergGPT**：金融领域 50B 模型
- **Med-PaLM**：医学领域
- **LawGPT**：法律领域
- **CodeLlama**：代码领域

**优势**：
- 效果上限高
- 深度领域适配

**局限**：
- 成本极高
- 需要大量数据
- 技术门槛高

**适用场景**：全新领域、模型需要深度学习特定知识、资源充足、长期使用的核心产品。

---

### 6. RLHF / DPO（对齐训练）

**核心思想**：通过人类反馈（奖励信号）让模型对齐人类偏好。

#### RLHF（传统方法）

训练三步走：

1. **SFT**：监督微调基础模型
2. **Reward Model**：用人类偏好数据训练奖励模型
3. **PPO**：用强化学习（PPO 算法）优化策略

代表：ChatGPT、Claude 早期版本

#### DPO（直接偏好优化）

- 直接用偏好数据优化策略
- 不需要单独训练 Reward Model
- 更稳定、更简单
- 效果接近 RLHF

DPO 损失函数：

```
L_DPO = -log(σ(β log(π_θ(y_w|x)/π_ref(y_w|x)) - β log(π_θ(y_l|x)/π_ref(y_l|x))))
```

其中 y_w 为 chosen（优选回答），y_l 为 rejected（拒绝回答）。

#### GRPO（群体相对策略优化）

- DeepSeek 提出的算法
- DeepSeek-R1 训练用的就是 GRPO
- 群体内相对优势估计
- 比 PPO 更高效

**偏好数据格式**（DPO）：

```json
{
    "prompt": "用户问题",
    "chosen": "好的回答",
    "rejected": "不好的回答"
}
```

**适用场景**：安全对齐、风格/语气定制、拒绝能力、推理能力提升（DeepSeek-R1）。

---

### 7. 预训练 + 指令微调 (CPT + SFT)

**核心思想**：从基础模型出发，先用领域语料继续预训练（CPT），再指令微调。

**两阶段流程**：

**第一阶段：继续预训练 (CPT)**
- 用海量领域文本继续训练（如医学论文 100GB）
- 学习领域语言模式、知识
- 算力消耗大

**第二阶段：监督微调 (SFT)**
- 用指令数据训练
- 学习任务格式
- 算力消耗相对较小

**代表项目**：
- **医学**：HuatuoGPT、MedicalGPT
- **法律**：LawGPT、ChatLaw
- **金融**：FinGPT
- **教育**：桃李

**适用场景**：模型需要真正"懂"这个领域、领域有大量无标注语料、算力充足（需要从 7B 起步训练）。

---

### 8. Agent + Tools（智能体方案）

**核心思想**：不动模型本身，给模型配备工具和决策能力。

**架构组成**：

```
LLM 作为大脑
 ├── 工具调用（搜索、API、数据库）
 ├── 记忆系统（短期/长期）
 ├── 规划能力（任务分解）
 └── 多 Agent 协作
```

**代表框架**：

| 框架 | 特点 |
|---|---|
| LangChain / LangGraph | 最主流，灵活性高 |
| LlamaIndex | 专注 RAG 场景 |
| AutoGen | 微软出品，多 Agent 协作 |
| CrewAI | 角色化多 Agent |
| Dify / Coze | 国内可视化搭建平台 |

**优势**：
- 不需要训练
- 灵活、可扩展
- 调试方便
- 可调用真实业务系统

**局限**：
- 依赖模型能力
- 复杂任务执行稳定性
- Token 消耗大

**适用场景**：复杂多步任务、需要调用外部系统、任务流程相对标准化。

---

## 三、场景化推荐方案

### 场景1：企业内部知识问答（HR、客服、文档助手）

**推荐：RAG + 轻量 LoRA**

- 知识库：RAG 解决
- 语气风格：LoRA 微调
- 工具：Coze/Dify/FastGPT

### 场景2：医疗诊断辅助

**推荐：预训练 + SFT + RAG + 安全对齐**

- 医学知识：预训练 + 指令微调
- 最新文献：RAG
- 安全性：RLHF/DPO

### 场景3：法律咨询

**推荐：RAG + LoRA**

- 法条/案例：RAG
- 回答风格：LoRA
- 引用溯源：RAG 自带

### 场景4：出行/打车 AI Agent

**推荐：Agent + RAG + 工具调用**

- 行程规划：Agent 规划
- 实时数据：工具调用
- 业务知识：RAG
- 风格定制：LoRA

### 场景5：金融风控

**推荐：RAG + 全量微调**

- 行业知识：全量微调
- 监管政策：RAG
- 决策可解释：RAG 引用

### 场景6：智能客服

**推荐：SFT + RAG + Agent**

- 业务知识库：RAG
- 对话能力：SFT
- 工单系统：Agent + Tools

---

## 四、技术选型决策树

```
需要注入新知识吗？
 ├─ 是 → 用 RAG（无需训练）
 └─ 否 → 需要改变模型行为吗？
 ├─ 否 → Prompt Engineering 即可
 └─ 是 → 有多少训练数据？
 ├─ <1k → Few-shot / Prompt
 ├─ 1k-10k → LoRA / QLoRA
 ├─ 10k-100k → 全量微调
 └─ >100k → 预训练 + SFT

需要风格/安全对齐？
 └─ 收集偏好数据 → DPO/GRPO

需要调用工具/复杂流程？
 └─ Agent + Tools
```

---

## 五、2024-2026 趋势观察

### 1. PEFT 成为主流

LoRA、QLoRA、DoRA、AdaLoRA 等参数高效微调方法几乎成为定制化微调的标准做法。

### 2. RAG 持续进化

- **GraphRAG**（微软开源）：基于知识图谱的检索
- **Agentic RAG**：Agent 自主决定检索策略
- **Self-RAG**：模型自评检索需求
- **多模态 RAG**：图文混合检索

### 3. 长上下文冲击传统 RAG

- Claude 200K、GPT-4 Turbo 128K、Gemini 1M
- 很多场景下"塞进 Prompt"就行
- 部分场景减少 RAG 需求

### 4. 偏好对齐技术演进

- **DPO** 逐步替代 RLHF（更简单）
- **GRPO** 在推理模型上大放异彩（DeepSeek-R1）
- **Process Reward Model**：对推理过程打分

### 5. Agent 框架成熟

- LangGraph、AutoGen、CrewAI 等框架日趋完善
- 工具调用标准化（Function Calling）
- 多 Agent 协作成为趋势

### 6. 合成数据崛起

- 用强模型生成训练数据（如 GPT-4 生成 → 训练小模型）
- Self-Play、Self-Improvement 成为研究热点

### 7. 模型合并技术

- 不同任务的 LoRA 合并
- 避免灾难性遗忘
- 灵活组合能力

---

## 六、推荐学习资源

### 框架与工具

| 类别 | 推荐 |
|---|---|
| 微调框架 | HuggingFace PEFT、LLaMA-Factory、Unsloth、Axolotl |
| RAG 框架 | LangChain、LlamaIndex、Haystack、Dify、FastGPT |
| Agent 框架 | LangGraph、AutoGen、CrewAI、Coze |
| 部署推理 | vLLM、SGLang、TGI、TensorRT-LLM |

### 重要论文

- **LoRA**: https://arxiv.org/abs/2106.09685
- **QLoRA**: https://arxiv.org/abs/2305.14314
- **DPO**: https://arxiv.org/abs/2305.18290
- **RAG 原始论文**: https://arxiv.org/abs/2005.11401
- **Self-RAG**: https://arxiv.org/abs/2310.11511
- **GraphRAG**: https://arxiv.org/abs/2404.16130

### 教程

- HuggingFace 官方 PEFT 教程
- LLaMA-Factory 文档
- DeepLearning.AI 短课程（RAG、Agent）

---

## 七、给产品经理的建议

作为 AI Agent 方向的产品经理，建议按以下顺序建立能力：

1. **优先掌握 RAG + Agent 框架**（80% 场景够用）
2. 理解 **LoRA 微调原理**（与技术团队沟通必备）
3. 在垂直场景做 PoC 时先从 **Prompt + RAG** 入手
4. 真正深度定制再考虑微调
5. 关注 **Agent 工具调用**和**多 Agent 协作**（这是产品差异化关键）

---

## 结语

让大模型成为"领域专家"不是只有微调一条路。**正确的方法是：从业务问题出发，选择最简单、最经济的方案**。

大多数时候，**RAG + Prompt + 工具调用**已经能解决 80% 的问题。微调是最后的选择，不是第一选择。

希望这份全景指南能帮助你在产品设计中做出更明智的技术决策。

---

*本文整理自对主流大模型定制化方法的研究与实践总结。如有疏漏，欢迎指正。*