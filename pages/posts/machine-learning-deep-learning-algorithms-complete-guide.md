---
title: 机器学习与深度学习算法全景指南（完整版）：从经典到前沿的详细手册
date: 2026-06-10T20:55:00
lang: zh
type: blog
description: 系统总结当前主流的机器学习与深度学习算法，覆盖24个核心算法，每个算法包含历史背景、算法详解、实际应用、当前现状（2024-2026）、参考资料。
---

[[toc]]

> 写在前面：本文是一份**完整版**算法地图。与速览版相比，每个算法都补齐了「历史背景 → 算法详解 → 实际应用 → 当前现状（2024-2026）→ 参考资料」五件套。它不是教科书，但希望成为你日后遇到陌生名词时愿意回来翻一翻的「参考书」。
>
> 读完它，你未必能立刻写出 S4 的状态矩阵推导，但应该能在一张白纸上回答三个问题：**这个问题该用哪类算法？这一类算法为什么这么设计？它和邻居们的边界在哪里？**

---

## 引言：为什么我们需要一张"算法全景图"

过去十年，AI 的关键词从"机器学习"换成"深度学习"，又从"深度学习"滑向"大模型"和"生成式 AI"。但热闹的名字背后，真正驱动这一切的，是几十个被反复验证过的核心算法。

- 想预测房价？线性回归仍然是工业 baseline。
- 想给用户做风控？XGBoost / LightGBM 依然是表格数据的事实标准。
- 想识别图片？CNN 留下了不可替代的遗产。
- 想让模型理解语言？Transformer 一统江湖。
- 想让模型自己学会下棋、开车？强化学习提供范式。
- 想让模型既快又长？Mamba 这类状态空间模型正在挑战 Transformer 的位置。

把这些算法铺开看，会发现一条很清晰的主线：**人类一直在尝试用更少的归纳偏置（inductive bias）换更强的表示能力**——从手工特征到自动特征，从局部假设到全局注意力，从静态预测到生成式输出。

下面，我们分两大部分展开。第一部分 12 个经典 ML 算法，第二部分 12 个深度学习算法。

---

# 第一部分：经典机器学习算法

经典机器学习算法是工业界"能直接落地、解释性强、训练便宜"的那一档。它们在结构化数据上仍然是最稳的选择，也是理解所有复杂模型的起点。

## 1. 线性回归（Linear Regression）

### 1.1 算法背景与历史

线性回归最早可以追溯到 **1805 年**，法国数学家 **Adrien-Marie Legendre** 发表「Nouvelles méthodes pour la détermination des orbites des comètes」时提出了**最小二乘法**（Least Squares）。1809 年，**Carl Friedrich Gauss** 也独立推导了该方法，并声称他早在 1795 年就已在用——这就是统计学里著名的"优先权之争"。

- 1886 年，**Francis Galton** 在研究父子身高时引入"回归"（regression）一词，发现子女身高有向均值"回归"的趋势，这也是"回归"名称的来源。
- 1901 年，**Karl Pearson** 正式给出相关系数的形式化定义。
- 1933 年，**Andrey Kolmogorov** 等人进一步给出线性回归的统计推断框架。
- 1970 年，**Hoerl 和 Kennard** 提出了**岭回归（Ridge Regression）**，即 L2 正则化。
- 1996 年，**Robert Tibshirani** 提出了**Lasso（L1 正则化）**，通过稀疏性实现了变量选择。
- 2005 年，**Hui Zou 和 Trevor Hastie** 提出了**Elastic Net**，结合 L1 和 L2 的优势。

里程碑论文：
- Legendre, A. M. (1805). *Nouvelles méthodes pour la détermination des orbites des comètes*.
- Hoerl, A. E., & Kennard, R. W. (1970). "Ridge Regression: Biased Estimation for Nonorthogonal Problems." *Technometrics*.
- Tibshirani, R. (1996). "Regression Shrinkage and Selection via the Lasso." *JRSS B*.
- Zou, H., & Hastie, T. (2005). "Regularization and Variable Selection via the Elastic Net." *JRSS B*.

### 1.2 算法详解

**核心假设**：输出是输入特征的线性组合加噪声：

$$y = w_1x_1 + w_2x_2 + \dots + w_nx_n + b + \epsilon,\quad \epsilon \sim \mathcal{N}(0, \sigma^2)$$

**求解方法**：

**(1) 正规方程（Normal Equation）**：对均方误差（MSE）求导令其为零，可得闭式解：

$$\mathbf{w}^* = (X^\top X)^{-1} X^\top y$$

优点：精确解、无需调学习率。缺点：当特征数 n > 10^5 或 $X^\top X$ 不可逆时计算困难。

**(2) 梯度下降（Gradient Descent）**：沿负梯度方向迭代更新：

$$w \leftarrow w - \eta \cdot \nabla_w L(w)$$

变体：批量（Batch）、随机（SGD）、小批量（Mini-batch）梯度下降。

**(3) 正则化扩展**：

- **Ridge（L2）**：损失函数加 $\lambda \sum w_i^2$，压缩系数但不会归零。
- **Lasso（L1）**：加 $\lambda \sum |w_i|$，倾向于产生稀疏解——自动做特征选择。
- **Elastic Net**：L1 + L2 组合，兼顾稀疏性与稳定性。

**关键概念**：

- **残差（Residual）**：预测值与真实值之差。
- **R² / 决定系数**：解释方差比例。
- **多重共线性**：特征高度相关时 $X^\top X$ 接近奇异，正则化可以缓解。
- **异方差性**：残差方差不恒定，可用稳健标准误处理。

### 1.3 实际应用案例

- **Zillow's Zestimate**：美国房地产估值平台，核心模型就是带正则化的线性回归加上结构化特征工程。
- **保险定价（精算）**：车险、人寿的费率表，本质就是 GLM（广义线性模型），线性回归的直接推广。
- **经济学建模**：GDP 与消费/投资关系、需求函数估计。
- **A/B 测试中的回归分析**：在控制协变量后估计处理效应。
- **Scikit-learn 的糖尿病/波士顿房价数据集**：教学与基准测试标配。

### 1.4 当前现状（2024-2026）

- 仍然是 Kaggle 表格比赛中**最常见的 baseline**，经常输给 XGBoost 不到 1%，但训练快、可解释。
- 在**因果推断**领域（DAG、Do-Calculus、Double Machine Learning）线性回归仍是默认起点。
- **稀疏线性模型**（Lasso 变体）在基因选择、信号处理中继续使用。
- 在 LLM 时代，**线性探针（linear probe）**成为评估隐藏层表示的标准方法——本质上就是线性回归。
- **Bayesian Linear Regression**（如 PyMC、Stan）在 A/B 实验、科学实验中常用。

### 1.5 参考资料

- [StatQuest: Linear Regression, Clearly Explained](https://www.youtube.com/watch?v=nk2CQITm_eo)
- [Scikit-learn Linear Models 文档](https://scikit-learn.org/stable/modules/linear_model.html)
- [《统计学习方法》李航 第1章](https://www.hangli-hl.com/uploads/3/1/4/9/31495481/统计学习方法_李航.pdf)
- [Tibshirani 1996 Lasso 原文](https://statweb.stanford.edu/~tibs/lasso/lasso.pdf)
- [《An Introduction to Statistical Learning》ISL 第3章](https://www.statlearning.com/)

---

## 2. 逻辑回归（Logistic Regression）

### 2.1 算法背景与历史

逻辑回归虽然名字里带"回归"，但实际是**分类算法**。它的发展脉络很清晰：

- 1838 年，**Pierre François Verhulst** 提出 Logistic 函数来建模人口增长。
- 1944 年，**Joseph Berkson** 将其引入统计学，称为 **logit** 模型。
- 1958 年，**David Cox** 在著名论文 *"The regression analysis of binary sequences"* 中正式系统化了逻辑回归。
- 1970 年代，**McCullagh 和 Nelder** 在《Generalized Linear Models》中把逻辑回归纳入 GLM 框架。
- 多分类扩展 One-vs-Rest（OvR）和 Softmax Regression（Multinomial Logistic）则在 1990 年代成熟。

里程碑论文：
- Cox, D. R. (1958). "The regression analysis of binary sequences." *JRSS B*.
- McCullagh, P., & Nelder, J. A. (1983). *Generalized Linear Models*. Chapman and Hall.
- Bishop, C. M. (2006). *Pattern Recognition and Machine Learning* 第4章。

### 2.2 算法详解

**核心思想**：在线性输出 $z = w^\top x + b$ 外套一层 Sigmoid 函数 $\sigma(z) = \frac{1}{1+e^{-z}}$，把输出压到 (0,1) 解释为概率。

**Sigmoid 函数**：

$$\sigma(z) = \frac{1}{1+e^{-z}}$$

性质：$\sigma'(z) = \sigma(z)(1-\sigma(z))$，值域 (0,1)，单调可微。

**Log Loss（对数损失）**：

$$L(y, \hat{y}) = -\frac{1}{N}\sum_{i=1}^{N}\left[y_i \log \hat{y}_i + (1-y_i)\log(1-\hat{y}_i)\right]$$

**最大似然估计（MLE）视角**：

似然函数 $L(w) = \prod_{i} \hat{y}_i^{y_i}(1-\hat{y}_i)^{1-y_i}$，对数似然最大化等价于最小化 Log Loss。

无闭式解，使用梯度下降或拟牛顿法（L-BFGS）求解。

**多分类扩展**：

- **One-vs-Rest (OvR)**：训练 K 个二分类器。
- **Softmax Regression（多项逻辑回归）**：直接用 Softmax 函数建模 K 类概率：

$$P(y=k|x) = \frac{e^{w_k^\top x + b_k}}{\sum_{j=1}^{K} e^{w_j^\top x + b_j}}$$

损失为**交叉熵损失**。

**关键概念**：

- **决策边界**：$\hat{y}=0.5$ 处，即 $w^\top x + b = 0$。
- **Logit**：$\text{logit}(p) = \log\frac{p}{1-p}$，是几率的自然对数。
- **正则化**：L1 产生稀疏解（特征选择），L2 防过拟合。

### 2.3 实际应用案例

- **广告 CTR 预估**：Google、Meta、Baidu 的早期广告系统核心就是 LR + 大量特征工程（特征交叉、归一化）。Google 2014 年发表的 *"Ad Click Prediction: a View from the Trenches"*（He et al.）即是 FTRL 优化 LR 的工业实践。
- **信贷风控**：蚂蚁集团、京东金融的信用评分卡底层是 LR。
- **医学诊断**：根据症状预测疾病概率。
- **垃圾邮件过滤**：1998 年至今仍是 baseline。
- **NLP 早期语言模型**：Berger & Della Pietra 1996 用 LR 估计翻译概率。
- **Facebook 的广告排序**：早期就是 LR + 手工交叉特征。

### 2.4 当前现状（2024-2026）

- 仍是**高解释性需求**场景的默认算法（金融、医疗、监管）。
- 在 LLM 输出**结构化分类**（意图识别、槽位抽取）的小模型基线中依然常见。
- **Federated Logistic Regression** 在跨设备联邦学习中扮演重要角色（Google GBoard）。
- 在**可解释 AI（XAI）**研究中，逻辑回归的系数直接作为 SHAP/LIME 解释器的高保真基线。
- 与深度学习的"混合"（如 Wide & Deep 架构）：LR 的"宽"部分负责记忆。
- **EBM（Explainable Boosting Machine）** 等"白盒"模型受 GDPR 推动而流行，本质上是加性 LR 的扩展。

### 2.5 参考资料

- [Scikit-learn Logistic Regression](https://scikit-learn.org/stable/modules/linear_model.html#logistic-regression)
- [《统计学习方法》李航 第6章](https://www.hangli-hl.com/uploads/3/1/4/9/31495481/统计学习方法_李航.pdf)
- [Google FTRL 论文（He et al. 2014）](https://www.researchgate.net/publication/262309215_Ad_Click_Prediction_a_View_from_the_Trenches)
- [《An Introduction to Statistical Learning》第4章](https://www.statlearning.com/)
- [InterpretML 文档](https://interpret.ml/)

---

## 3. 决策树（Decision Tree）

### 3.1 算法背景与历史

决策树是符号学习（symbolic learning）的代表，其思想可以追溯到哲学和统计学很早的年代：

- **1963 年**，**Morgan 和 Sonquist** 在《American Sociological Review》提出 **AID（Automatic Interaction Detection）**，是最早的回归树。
- **1979 年**，**J. Ross Quinlan** 开发了 **ID3**（Iterative Dichotomiser 3），引入**信息增益**作为划分准则。
- **1984 年**，Quinlan 提出 **C4.5**，用**信息增益率**修正 ID3 对多值特征的偏好。
- **1984 年**，**Breiman、Friedman、Olshen、Stone** 提出 **CART**（Classification and Regression Trees），引入 **Gini 系数**和**后剪枝**。
- **1993 年**，Quinlan 改进 C4.5 得到 **C5.0**（商业版），更快、支持 boosting。
- 2017 年，**Hastie、Tibshirani** 在《ISL》中系统介绍了基于条件推断树的 `party` 包。

里程碑论文：
- Quinlan, J. R. (1986). "Induction of Decision Trees." *Machine Learning*.
- Breiman, L., Friedman, J., Olshen, R., & Stone, C. (1984). *Classification and Regression Trees*. Wadsworth.

### 3.2 算法详解

**核心思想**：用一系列 if/else 规则对特征空间做划分，叶节点给出预测（分类为类别，回归为均值）。

**关键概念**：

**(1) 划分准则**

- **信息增益（Information Gain）**：父节点熵减去子节点加权熵，ID3 用此。

$$\text{IG}(D, a) = H(D) - \sum_{v} \frac{|D_v|}{|D|} H(D_v)$$

- **信息增益率（Gain Ratio）**：C4.5 用此，惩罚取值多的特征。

$$\text{GainRatio}(D, a) = \frac{\text{IG}(D, a)}{H_a(D)}$$

- **Gini 系数**：CART 分类树用此，衡量不纯度。

$$\text{Gini}(D) = 1 - \sum_{k} p_k^2$$

- **MSE（均方误差）**：CART 回归树用此。

**(2) 树的生长**

- 递归二分，直到叶节点纯度满足阈值或样本数过小。
- 预停止：限制最大深度、叶节点最小样本数、最小信息增益。
- 剪枝（Pruning）：
  - **预剪枝（Pre-pruning）**：在生长时限制。
  - **后剪枝（Post-pruning）**：C4.5 用**悲观剪枝（Pessimistic Error Pruning）**；CART 用**代价复杂度剪枝（Cost-Complexity Pruning）**。

**(3) 关键参数**

- `max_depth`、`min_samples_split`、`min_samples_leaf`、`max_features`、`criterion`。

### 3.3 实际应用案例

- **银行信贷审批**：传统信用评分的规则可视化。
- **医学诊断辅助**：Mayo Clinic 等机构用决策树辅助诊断流程。
- **金融反欺诈**：规则可解释、可审计。
- **Scikit-learn `DecisionTreeClassifier` 教程**：经典 Iris 数据集。
- **医疗 AI 产品（IBM Watson Health）**：部分模块基于决策树。
- **CART 在保险**：精算师用 CART 拟合风险分层。

### 3.4 当前现状（2024-2026）

- 单棵决策树很少直接用于生产，但**几乎所有 GBDT 算法的基学习器都是 CART 树**。
- 在**可解释 AI**领域，因其天然可画流程图，常被用作"白盒"基线（欧盟 GDPR 要求"解释权"）。
- **InterpretML** 等工具的"explainable boosting machine"（EBM）本质是玻璃盒的广义加性模型 + 树。
- **Optimal Decision Trees**（如 OCT、HHCART）在 2020-2024 年间受到关注，结合了运筹优化方法学。
- 在**AutoML**中（如 H2O、Auto-sklearn），决策树作为基本构件被反复组合。
- **Sparse Decision Trees（2024）**等研究关注在树结构中显式做特征选择。

### 3.5 参考资料

- [Scikit-learn Decision Trees 文档](https://scikit-learn.org/stable/modules/tree.html)
- [《统计学习方法》李航 第5章](https://www.hangli-hl.com/uploads/3/1/4/9/31495481/统计学习方法_李航.pdf)
- [C4.5 算法 Quinlan 1993 原文](https://link.springer.com/article/10.1007/BF00993309)
- [CART 经典书 Breiman et al. 1984](https://www.amazon.com/Classification-Regression-Trees-Leo-Breiman/dp/0412048418)
- [InterpretML 文档](https://interpret.ml/)

---

## 4. 随机森林（Random Forest）

### 4.1 算法背景与历史

随机森林是 **Bagging + 随机特征子集**的集大成者：

- **1996 年**，**Leo Breiman** 发表 **Bagging（Bootstrap Aggregating）**，提出通过自助采样训练多棵树然后投票/平均。
- **1998 年**，**Tin Kam Ho** 在 *Random Subspace Method* 中提出对特征也做随机选择。
- **2001 年**，**Leo Breiman** 在 *Machine Learning* 期刊正式发表 *"Random Forests"*，把两者结合起来并系统分析其收敛性和特征重要性度量。
- 后续发展包括 **Extra Trees**（Geurts et al. 2006）和 **Isolation Forest**（Liu et al. 2008，用于异常检测）。

里程碑论文：
- Breiman, L. (1996). "Bagging Predictors." *Machine Learning*.
- Breiman, L. (2001). "Random Forests." *Machine Learning* 45(1).
- Ho, T. K. (1998). "The Random Subspace Method for Constructing Decision Forests." *IEEE TPAMI*.

### 4.2 算法详解

**核心思想**：通过引入"样本随机性"和"特征随机性"构建多棵**去相关**的决策树，最终通过投票（分类）或平均（回归）输出。

**算法流程**：

1. **Bootstrap 采样**：从 N 个样本中有放回地抽 N 个，训练一棵树；约 63.2% 样本被抽到。
2. **每棵树分裂时**：从全部 d 个特征中随机选 m = √d（分类）或 d/3（回归）个候选。
3. **完全生长**：每棵树都长到最大，不剪枝。
4. **聚合**：分类用多数投票，回归用平均。

**为什么有效（理论保证）**：

泛化误差上界：

$$\text{PE}^* \leq \frac{\bar{\rho}(1-s^2)}{s^2}$$

其中 $\bar{\rho}$ 是树间相关性，$s^2$ 是单棵树强度。**减小相关性就能减小误差上限**——这就是特征随机选择的理论依据。

**关键概念**：

- **OOB（Out-of-Bag）估计**：未抽中的 36.8% 样本可作验证集，无需另设 test set。
- **特征重要性**：
  - **Mean Decrease Impurity (MDI)**：Gini 减少量加总。
  - **Mean Decrease Accuracy (MDA) / Permutation Importance**：打乱某特征后 OOB 准确率下降幅度。
- **Proximities**：样本在森林中落进同一叶子的次数，可用于异常检测、可视化。

### 4.3 实际应用案例

- **微软 Kinect 的人体姿态识别**：随机森林 + 决策森林。
- **Netflix Prize（2006-2009）**：冠军队 BellKor's Pragmatic Chaos 用了 100+ 模型融合，随机森林是其中重要成员。
- **生态学/医学研究**：随机森林是生物信息学（基因选择、生存分析）的标配。
- **金融反欺诈**：LightGBM/XGBoost 之外，随机森林是常用强基线。
- **遥感图像分类**：土地利用分类（随机森林 + 多光谱）。
- **医学影像分割**：部分应用使用随机森林作为像素级分类器。

### 4.4 当前现状（2024-2026）

- 在**中等规模结构化数据**上仍是非常强且鲁棒的 baseline。
- **Permutation Importance** 已成为模型可解释性的标准工具（与 SHAP 互补）。
- **Random Forest 在生物医学**：Nature Medicine 等期刊上几乎"滥大街"——单细胞、影像组学、临床预测。
- **因果随机森林（Athey & Wager 2018）**、**Generalized Random Forests** 把森林从"预测"扩展到"因果推断"，是 2020 年代以来最活跃的方向之一。
- 在 LLM 时代，随机森林被用作**表格数据上 LLM 的对照基线**（TabPFN 等小样本表格 LLM 的对手）。
- **Quantum Random Forest**（2020-2024）作为新兴方向被探索。

### 4.5 参考资料

- [Breiman 2001 论文原文](https://link.springer.com/article/10.1023/A:1010933404324)
- [Scikit-learn Random Forest 文档](https://scikit-learn.org/stable/modules/ensemble.html#random-forests)
- [Athey & Wager 2018 广义随机森林](https://arxiv.org/abs/1610.01271)
- [《An Introduction to Statistical Learning》第8章](https://www.statlearning.com/)

---

## 5. GBDT / XGBoost / LightGBM / CatBoost

### 5.1 算法背景与历史

GBDT（Gradient Boosting Decision Tree）家族是 Kaggle 时代表格数据的"统治者"：

- **1997 年**，**Jerome Friedman** 发表 *"Greedy Function Approximation: A Gradient Boosting Machine"*，正式提出 **Gradient Boosting** 算法（受 Breiman 1997 *"Arcing the Edge"* 启发）。
- **1999 年**，Friedman 在 *"Stochastic Gradient Boosting"* 中引入行采样。
- **2001 年**，**Mason、Bartlett、Baxter** 等人在 *"Boosting Algorithms as Gradient Descent in Function Space"* 中给出函数空间视角。
- **2014 年**，**Tianqi Chen**（陈天奇）发布 **XGBoost**（eXtreme Gradient Boosting），加上二阶泰勒展开、正则化、稀疏感知、Cache-aware 等工程优化。2016 年发表 *XGBoost: A Scalable Tree Boosting System* 论文。
- **2017 年**，**Microsoft 发布 LightGBM**（Guolin Ke 等人），引入直方图算法、Leaf-wise 生长、GOSS、EFB。
- **2017 年**，**Yandex 发布 CatBoost**（Anna Veronika Dorogush 等人），专注处理**类别特征**和**目标泄漏**问题。
- **2019 年至今**：H2O、HistGradientBoosting、ThunderGBM 等持续演化。

里程碑论文：
- Friedman, J. H. (2001). "Greedy Function Approximation: A Gradient Boosting Machine." *Annals of Statistics*.
- Chen, T., & Guestrin, C. (2016). "XGBoost: A Scalable Tree Boosting System." *KDD*.
- Ke, G., et al. (2017). "LightGBM: A Highly Efficient Gradient Boosting Decision Tree." *NeurIPS*.
- Prokhorenkova, L., et al. (2018). "CatBoost: Unbiased Boosting with Categorical Features." *NeurIPS*.

### 5.2 算法详解

**加法模型（Additive Model）与前向分步算法**：

最终模型是树的加法：

$$F_M(x) = \sum_{m=1}^{M} \gamma_m h_m(x)$$

每一步训练一棵新树去拟合当前模型的"残差"或更一般地**损失函数的负梯度**。

**负梯度（伪残差）**：

$$\tilde{y}_i = -\left[\frac{\partial L(y_i, F(x_i))}{\partial F(x_i)}\right]_{F=F_{m-1}}$$

**XGBoost 的核心贡献**：

对损失函数做**二阶泰勒展开**：

$$L^{(t)} \approx \sum_i \left[ L(y_i, F_{t-1}(x_i)) + g_i f_t(x_i) + \frac{1}{2} h_i f_t^2(x_i) \right] + \Omega(f_t)$$

其中 $g_i, h_i$ 是一阶、二阶梯度。

叶节点最优权重：

$$w_j^* = -\frac{G_j}{H_j + \lambda}$$

结构分数（Gain）：

$$\text{Gain} = \frac{1}{2}\left[\frac{G_L^2}{H_L+\lambda} + \frac{G_R^2}{H_R+\lambda} - \frac{(G_L+G_R)^2}{H_L+H_R+\lambda}\right] - \gamma$$

**LightGBM 的核心创新**：

- **直方图算法（Histogram）**：连续特征分箱成 bin（默认 255），加速分裂点查找。
- **Leaf-wise 生长**：每次找分裂增益最大的叶节点（与 XGBoost 的 level-wise 相比更深）。
- **GOSS（Gradient-based One-Side Sampling）**：保留大梯度样本，随机采小梯度样本。
- **EFB（Exclusive Feature Bundling）**：将互斥特征捆绑减少特征数。

**CatBoost 的核心创新**：

- **Ordered Target Statistics（Ordered TS）**：用更早的样本计算类别特征的 target encoding，避免目标泄漏。
- **Ordered Boosting**：用专门的排序提升方法处理预测偏移（prediction shift）。
- **对称（oblivious）树**：每层用相同分裂，便于推理加速。
- 原生支持**类别特征**，无需 one-hot。

**关键概念**：

- **学习率（learning rate / shrinkage）**：$\nu$ 控制每棵树贡献，常设 0.01-0.1。
- **子采样（subsample）**：行采样、列采样。
- **早停（early stopping）**：用验证集 N 轮无提升则停。
- **n_estimators vs max_depth**：树的数量 vs 复杂度。

### 5.3 实际应用案例

- **Kaggle 比赛冠军"屠榜"**：2015-2021 年间几乎所有结构化数据竞赛的 top 方案都包含 XGBoost/LightGBM/CatBoost。
- **Uber Eats、Airbnb 的定价模型**：用 GBDT 预测需求、价格、ETA。
- **金融风控**：支付宝、PayPal、Stripe 的反欺诈评分卡。
- **微软 Bing 搜索排序**：曾用 LightGBM 排序学习模型（LambdaMART 是其前身）。
- **Yandex 搜索**：CatBoost 的最初应用场景。
- **保险精算**：CatBoost 广泛用于车险欺诈识别。
- **推荐系统**：YouTube、淘宝的排序模型底层都涉及树模型（GBDT + 深度学习组合）。

### 5.4 当前现状（2024-2026）

- **表格数据的"事实标准"**：在 2024 NeurIPS Tables 竞赛中仍是冠军级别。
- **NGBoost**（2020）扩展到概率预测。
- **TabPFN / TabPFN-v2（2024-2025）**：用 Transformer 做"表格数据的 prior-fitted network"，在小到中等数据上击败 GBDT 引起轰动，但大数据集仍输给 GBDT。
- **GPU 加速**：cuML 的 `cuml.ensemble.RandomForestClassifier`、NVIDIA 的"DALBERT"等让 GBDT 进一步提速。
- **与深度学习的融合**：TabNet、FT-Transformer、SAINT 等深度表格模型仍无法稳定击败 GBDT，这成为 ML 界著名的"unreasonable effectiveness of GBDT"现象。
- **LightGBM 4.x** 持续更新并行策略与多线程优化。
- **CatBoost 在 GPU 上的训练** 已与 CPU 性能相当甚至更快。
- **"GBDT 仍是表格 SOTA"** 是 2024 Kaggle Grandmaster 调研中的主流结论。

### 5.5 参考资料

- [XGBoost 官方文档](https://xgboost.readthedocs.io/)
- [LightGBM 官方文档](https://lightgbm.readthedocs.io/)
- [CatBoost 官方文档](https://catboost.ai/en/docs/)
- [XGBoost 论文 (Chen & Guestrin 2016)](https://arxiv.org/abs/1603.02754)
- [LightGBM 论文 (Ke et al. 2017)](https://papers.nips.cc/paper/2017/hash/6449f44a102fde848669bdd9eb6b76fa-Abstract.html)
- [CatBoost 论文 (Prokhorenkova et al. 2018)](https://arxiv.org/abs/1706.09516)
- [TabPFN-v2 论文](https://arxiv.org/abs/2408.09813)

---

## 6. 支持向量机（SVM）

### 6.1 算法背景与历史

SVM 是统计学习理论（VC 维、结构风险最小化）的代表性算法：

- **1963 年**，**Vapnik 和 Chervonenkis** 提出了 **VC 维（Vapnik–Chervonenkis dimension）** 理论。
- **1964 年**，**Vapnik 和 Chervonenkis** 提出"最优超平面"概念的雏形。
- **1992 年**，**Boser、Guyon、Vapnik** 在 COLT 上发表 *"A training algorithm for optimal margin classifiers"*，引入**核技巧**（kernel trick），现代 SVM 诞生。
- **1995 年**，**Vapnik 和 Cortes** 在 *Machine Learning* 期刊正式发表 *"Support-Vector Networks"*，提出**软间隔**和 C-SVM 形式。
- **1997 年**，**Platt 提出了 SMO（Sequential Minimal Optimization）** 序列最小优化算法，使 SVM 训练实用化。
- **1998 年**，**Schölkopf** 等人扩展出 **ν-SVM**。
- **2000 年代**：核方法、Kernel Ridge Regression、Gaussian Processes 一度非常流行。

里程碑论文：
- Cortes, C., & Vapnik, V. (1995). "Support-Vector Networks." *Machine Learning* 20(3).
- Platt, J. (1998). "Sequential Minimal Optimization: A Fast Algorithm for Training Support Vector Machines." *Microsoft Research Technical Report*.
- Boser, B. E., Guyon, I. M., & Vapnik, V. N. (1992). "A Training Algorithm for Optimal Margin Classifiers." *COLT*.

### 6.2 算法详解

**核心思想**：在两类之间找**间隔最大**的超平面，并通过核函数映射到高维空间处理非线性。

**最大间隔超平面**：

对二分类 $(x_i, y_i), y_i \in \{-1, +1\}$，求解：

$$\min_{w, b} \frac{1}{2}\|w\|^2 \quad \text{s.t.} \quad y_i(w^\top x_i + b) \geq 1, \forall i$$

**支持向量**：满足 $y_i(w^\top x_i + b) = 1$ 的样本。

**软间隔（Soft Margin）**：

允许部分样本违反约束，引入松弛变量 $\xi_i \geq 0$：

$$\min_{w, b, \xi} \frac{1}{2}\|w\|^2 + C \sum_i \xi_i \quad \text{s.t.} \quad y_i(w^\top x_i + b) \geq 1 - \xi_i$$

参数 C 控制"间隔宽度"和"误分类惩罚"的权衡。

**核技巧（Kernel Trick）**：

通过核函数 $K(x_i, x_j) = \phi(x_i)^\top \phi(x_j)$ 隐式映射到高维空间，避免显式计算：

- **线性核**：$K(x, y) = x^\top y$。
- **多项式核**：$K(x, y) = (x^\top y + c)^d$。
- **RBF（高斯）核**：$K(x, y) = \exp(-\gamma \|x - y\|^2)$。
- **Sigmoid 核**：$K(x, y) = \tanh(\kappa x^\top y + c)$。

Mercer 定理保证核函数的有效性。

**SMO 算法**：

把大规模 QP 问题分解为一系列只涉及两个拉格朗日乘子的子问题，闭式求解。

**对偶形式**：

$$\max_{\alpha} \sum_i \alpha_i - \frac{1}{2}\sum_{i,j}\alpha_i\alpha_j y_i y_j K(x_i, x_j) \quad \text{s.t.} 0 \leq \alpha_i \leq C, \sum_i \alpha_i y_i = 0$$

**多分类扩展**：

- **One-vs-Rest**：K 个分类器。
- **One-vs-One**：K(K-1)/2 个分类器。
- **Crammer-Singer**：单目标多分类 SVM。

**支持向量回归（SVR）**：$\epsilon$-不敏感损失。

### 6.3 实际应用案例

- **文本分类**：在深度学习之前 SVM 是文本分类的事实标准（Joachims 1998 *"Text Categorization with Support Vector Machines"*），至今在小数据上仍有一席之地。
- **手写数字识别**：MNIST 早期最佳分类器。
- **生物信息学**：基因表达数据、蛋白质分类（SVM 仍常用）。
- **图像分类**：HOG 特征 + SVM 长期是行人检测的标配（Dalal & Triggs 2005）。
- **人脸检测**：OpenCV 的 Haar 特征 + 级联 AdaBoost/SVM 早期版本。
- **金融时间序列预测**：少量研究仍在用 SVM。
- **药物发现**：SVM 用于化合物活性预测。

### 6.4 当前现状（2024-2026）

- 在深度学习时代，SVM 在 CV/NLP 的主流地位已被神经网络取代。
- **小到中等规模数据**（几千到几万个样本）上，**SVM 仍是强 baseline**——尤其是高维、类别少。
- **核方法 + 深度学习**：深度核学习（Deep Kernel Learning, Wilson et al. 2016）、**Neural Tangent Kernel**（Jacot et al. 2018）让核方法与神经网络融合。
- **GAM（广义加性模型）+ SVM** 用于可解释 ML。
- **支持向量数据描述（SVDD, Tax & Duin 2004）** 在异常检测、单类分类中持续使用。
- 与 Transformer 时代并行：**SVM 仍是 scikit-learn 用户最常用的算法 Top 3**。
- 在**表格数据 vs 深度学习**的对照实验中，SVM 经常作为非树 baseline 出现。

### 6.5 参考资料

- [Scikit-learn SVM 文档](https://scikit-learn.org/stable/modules/svm.html)
- [Cortes & Vapnik 1995 论文](https://link.springer.com/article/10.1007/BF00994018)
- [《统计学习方法》李航 第7章](https://www.hangli-hl.com/uploads/3/1/4/9/31495481/统计学习方法_李航.pdf)
- [《Understanding Machine Learning》Shai Shalev-Shwartz 第17章](https://www.cs.huji.ac.il/~shais/UnderstandingMachineLearning/understanding-machine-learning-theory-algorithms.pdf)
- [Platt SMO 笔记](https://www.microsoft.com/en-us/research/wp-content/uploads/2016/02/tr-98-14.pdf)

---

## 7. K 近邻（KNN）

### 7.1 算法背景与历史

KNN 是"lazy learning"的代表，思想朴素却历史悠久：

- **1951 年**，**Fix 和 Hodges** 在非公开技术报告中提出 **最近邻判别规则**（非参数判别分析）。
- **1967 年**，**Cover 和 Hart** 在 *IEEE Transactions on Information Theory* 发表 *"Nearest Neighbor Pattern Classification"*，给出 KNN 的理论分析，证明其错误率上限不超过贝叶斯最优分类器的两倍。
- **1970-1980 年代**：KD-Tree（**Bentley 1975**）和 Ball Tree（**Omohundro 1989**）等数据结构发展，使 KNN 在低维下高效。
- **2000 年代后**：LSH（Locality Sensitive Hashing）解决高维 KNN；**Annoy**、**HNSW**（Malkov & Yashunin 2016）、**FAISS**（Johnson et al. 2017）成为工业级 ANN 库。
- 2020 年代：**向量数据库**（Pinecone、Milvus、Weaviate、Qdrant）爆发，本质上是工业级 KNN。

里程碑论文：
- Cover, T., & Hart, P. (1967). "Nearest Neighbor Pattern Classification." *IEEE TIT*.
- Bentley, J. L. (1975). "Multidimensional Binary Search Trees Used for Associative Searching." *CACM*.
- Malkov, Y. A., & Yashunin, D. A. (2016). "Efficient and Robust Approximate Nearest Neighbor Search Using Hierarchical Navigable Small World Graphs." *IEEE TPAMI*.

### 7.2 算法详解

**核心思想**：一个样本的类别由训练集中**最近的 K 个邻居**投票决定。

**算法流程**：

1. 给定测试样本 $x$。
2. 计算 $x$ 与所有训练样本的距离 $d(x, x_i)$。
3. 找出 K 个最近的样本。
4. 分类用多数投票；回归用均值或加权均值。

**距离度量**：

- **欧氏距离（L2）**：$d(x, y) = \sqrt{\sum (x_i - y_i)^2}$，最常用。
- **曼哈顿距离（L1）**：$d(x, y) = \sum |x_i - y_i|$。
- **闵可夫斯基距离（Minkowski）**：$d(x, y) = (\sum |x_i - y_i|^p)^{1/p}$，L1/L2 的推广。
- **余弦相似度**：$\text{cos}(x, y) = \frac{x \cdot y}{\|x\| \|y\|}$，文本检索常用。
- **马氏距离（Mahalanobis）**：考虑特征相关性，$d(x, y) = \sqrt{(x-y)^\top \Sigma^{-1} (x-y)}$。

**关键概念**：

- **K 的选择**：K 太小 → 噪声敏感；K 太大 → 边界模糊。常用交叉验证，K=5 或 K=10 起点。
- **Lazy Learning**：训练阶段只存数据，预测时计算。
- **维度灾难**：维度 d 增长时，"近邻"概念失效——所有点几乎等距。
- **特征归一化**：KNN 对特征尺度敏感，必须标准化。
- **加权 KNN**：用距离倒数作为投票权重，$\text{weight} = 1/d$。

**加速结构**：

- **KD-Tree**：二叉空间分割树，低维（d < 20）查询 O(log N)。
- **Ball Tree**：用超球体分割，对高维更鲁棒。
- **HNSW（Hierarchical Navigable Small World）**：图结构，O(log N) 查询、内存友好，目前向量检索的事实标准。
- **LSH（Locality Sensitive Hashing）**：概率性近似，O(1) 哈希桶查询。
- **IVF（Inverted File Index）**：FAISS 默认加速结构。

### 7.3 实际应用案例

- **推荐系统**：Spotify、Netflix 早期用 item-based CF + KNN 做相似度检索。
- **手写数字识别**：MNIST 上 KNN 仍能到 95%+ 准确率。
- **基因表达分析**：根据相似表达谱推断样本类型。
- **入侵检测**：基于 KNN 的网络流量异常检测。
- **图像检索**：用 CNN 提特征 + KNN 检索。
- **RAG 系统**：当前 LLM 的 retrieval-augmented generation（向量数据库）底层就是 ANN-KNN。
- **Pinecone、Weaviate、Milvus、Qdrant** 等向量数据库使 KNN 真正进入生产。

### 7.4 当前现状（2024-2026）

- **KNN 重新成为主角**：LLM 的 RAG、推荐系统、人脸识别、图像去重全部依赖 ANN-KNN。
- **HNSW 几乎一统江湖**：成为向量数据库默认索引。
- **FAISS、HNSWlib、Annoy** 等开源库性能持续优化。
- **Memory-efficient KNN**：DiskANN（Microsoft 2019）把图索引放到磁盘上支持十亿级向量。
- **学习哈希（Learning to Hash, LTH）**：用深度学习把样本映射到二值码，再做汉明距离 KNN。
- **在 4-bit / 二值化** 场景下，KNN 的召回率与浮点接近，被广泛部署到边缘。

### 7.5 参考资料

- [Scikit-learn KNN 文档](https://scikit-learn.org/stable/modules/neighbors.html)
- [Cover & Hart 1967 论文](https://ieeexplore.ieee.org/document/1053964)
- [HNSW 论文 (Malkov & Yashunin 2016)](https://arxiv.org/abs/1603.09320)
- [FAISS 论文 (Johnson et al. 2017)](https://arxiv.org/abs/1702.08734)
- [《An Introduction to Statistical Learning》第2章](https://www.statlearning.com/)

---

## 8. 朴素贝叶斯（Naive Bayes）

### 8.1 算法背景与历史

朴素贝叶斯以贝叶斯定理为基础，是"条件独立假设"下的最简概率分类器：

- **1763 年**，**Thomas Bayes** 的遗作 *An Essay towards solving a Problem in the Doctrine of Chances* 发表了**贝叶斯定理**（后人整理出版）。
- **1795 年**，**Pierre-Simon Laplace** 独立重新发现并发展了贝叶斯方法，提出**拉普拉斯平滑**。
- **1950 年代**，**Marvin Minsky** 等早期 AI 研究者将概率方法引入模式识别。
- **1960 年代**，文本检索领域开始用**词袋模型 + 朴素贝叶斯**。
- **1990 年代**，**SPAM** 垃圾邮件过滤是朴素贝叶斯最经典的应用（Metsis et al. 2006 *"Spam Filtering with Naive Bayes — Which Naive Bayes?"* 是综述）。
- **多类变体**：**Multinomial NB**（文本）、**Bernoulli NB**（二元特征）、**Gaussian NB**（连续特征）。

里程碑论文：
- Metsis, V., Androutsopoulos, I., & Paliouras, G. (2006). "Spam Filtering with Naive Bayes – Which Naive Bayes?" *CEAS*.
- Lewis, D. D. (1998). "Naive (Bayes) at Forty: The Independence Assumption in Information Retrieval." *ECML*.

### 8.2 算法详解

**核心思想**：基于贝叶斯定理 + "特征条件独立"假设，计算后验概率。

**贝叶斯定理**：

$$P(y|x) = \frac{P(x|y) P(y)}{P(x)}$$

**条件独立假设**（"朴素"之处）：

$$P(x|y) = \prod_{i=1}^{d} P(x_i|y)$$

即给定类别 y，特征之间相互独立。

**判别规则**（取对数后等价）：

$$\hat{y} = \arg\max_{y} P(y) \prod_{i} P(x_i|y) = \arg\max_y \left[\log P(y) + \sum_i \log P(x_i|y)\right]$$

**参数估计**（最大似然）：

- 先验：$P(y=c) = \frac{N_c}{N}$
- 似然（多项式 NB）：$P(x_i = v | y = c) = \frac{N_{ic} + \alpha}{N_c + \alpha V}$，其中 V 是词表大小。

**拉普拉斯平滑（Laplace Smoothing）**：

朴素贝叶斯最常见的"修补"——给分子分母各加 $\alpha$（常取 1），避免零概率：

$$P(x_i = v | y = c) = \frac{N_{ic} + \alpha}{N_c + \alpha V}$$

**多类变体**：

- **Multinomial Naive Bayes**：特征是词频（文本分类首选）。
- **Bernoulli Naive Bayes**：特征是 0/1（出现/不出现）。
- **Gaussian Naive Bayes**：特征是连续值，假设 $P(x_i|y) \sim \mathcal{N}(\mu_{iy}, \sigma^2_{iy})$。

**关键概念**：

- **生成式 vs 判别式**：NB 是生成式（学习 P(x,y)），LR 是判别式（学 P(y|x)）。
- **零频率问题**：未在训练集出现的特征会让整个样本概率为 0，必须用平滑。
- **独立性假设的违反**：实际特征几乎都相关，NB 仍然有效是因为"分类只需要比较大小，不需要精确概率"。

### 8.3 实际应用案例

- **垃圾邮件过滤**：1990s 至今仍是经典 baseline（SpamAssassin 等）。
- **文本分类 / 情感分析**：在小到中等语料上常作为强 baseline。
- **推荐系统**：隐式反馈的 NB 协同过滤。
- **医学诊断**：根据症状判断疾病。
- **新闻分类**：经典 20 Newsgroups 数据集上 Multinomial NB 表现稳健。
- **早期 NLP 工具**：NLTK 默认教程使用 NB。

### 8.4 当前现状（2024-2026）

- 在深度学习时代，NB 主要作为**教学和 baseline**。
- 仍是**小数据文本分类**的强基线，常常不输简单神经网络。
- **AODE（Average One-Dependence Estimator, Webb et al. 2005）**、**HNB（Hidden Naive Bayes, Jiang et al. 2009）** 等尝试放松独立假设。
- 在**生产级 NLP** 中多被 BERT 等模型取代。
- **贝叶斯深度学习**（如 MC Dropout、Bayesian Neural Networks）借鉴 NB 思想。
- **语言模型中的"朴素贝叶斯"假设**：在 prompt engineering 中用于做简易的类比推理（"X 像 Y 因此 Y 也像 X"）。
- 在**可解释 AI 视角下**，NB 是最透明的概率分类器之一。

### 8.5 参考资料

- [Scikit-learn Naive Bayes 文档](https://scikit-learn.org/stable/modules/naive_bayes.html)
- [《统计学习方法》李航 第4章](https://www.hangli-hl.com/uploads/3/1/4/9/31495481/统计学习方法_李航.pdf)
- [Metsis et al. 2006 论文](https://www2.aueb.gr/users/ion/docs/ceas2006_paper.pdf)
- [《Speech and Language Processing》Jurafsky & Martin 第4章](https://web.stanford.edu/~jurafsky/slp3/)

---

## 9. K-Means 聚类

### 9.1 算法背景与历史

K-Means 是最古老也最常用的聚类算法：

- **1957 年**，**Hugo Steinhaus** 在 *Bulletin de l'Académie Polonaise des Sciences* 提出最早的概念。
- **1967 年**，**Stuart Lloyd** 在 Bell Labs 提出 **Lloyd 算法**（"Least Squares Quantization in PCM"），但因专利未发表；1982 年正式发表。
- **1975 年 / 1979 年**，**E.W. Forgy** 和 **J.A. Hartigan** 各自独立实现类似算法，命名为"k-means"。
- **2007 年**，**Arthur 和 Vassilvitskii** 提出 **K-Means++** 初始化策略，给出近似最优的理论保证。
- **2010 年**，**Sculley** 提出 **Mini-Batch K-Means**，适合大数据。
- 后续：Spherical K-Means（文本）、Kernel K-Means（非线性）等扩展。

里程碑论文：
- Lloyd, S. P. (1982). "Least Squares Quantization in PCM." *IEEE TIT*.
- Arthur, D., & Vassilvitskii, S. (2007). "k-means++: The Advantages of Careful Seeding." *SODA*.
- Sculley, D. (2010). "Web-Scale K-Means Clustering." *WWW*.

### 9.2 算法详解

**核心思想**：把样本分到 K 个簇，使簇内平方和（SSE / inertia）最小：

$$\min_{C_1, \dots, C_K} \sum_{k=1}^{K} \sum_{x \in C_k} \|x - \mu_k\|^2$$

**Lloyd 算法流程**：

1. 初始化 K 个簇心 $\mu_1, \dots, \mu_K$。
2. **Assignment step**：每个样本归到最近簇心 $C_k = \{x : \|x - \mu_k\| = \min_j \|x - \mu_j\|\}$。
3. **Update step**：重新计算簇心 $\mu_k = \frac{1}{|C_k|} \sum_{x \in C_k} x$。
4. 重复 2-3 直到收敛（簇心不再变化或变化小于阈值）。

**复杂度**：每次迭代 O(KNd)，d 是维度。

**K-Means++ 初始化**：

1. 随机选第一个簇心。
2. 每个样本被选为下一个簇心的概率与其到最近已选簇心的距离平方成正比。
3. 重复 K 次。

理论保证：以 O(log K) 近似最优。

**关键概念**：

- **K 的选择**：
  - **肘部法则（Elbow Method）**：画 SSE-K 曲线，找拐点。
  - **轮廓系数（Silhouette Score）**：衡量簇内紧密度和簇间分离度，取值 [-1, 1]。
  - **Gap Statistic**（Tibshirani et al. 2001）。
- **球形假设**：K-Means 偏好大小相近的球形簇，对带噪声、非凸分布差。
- **维度灾难**：高维时欧氏距离失效。
- **加速变体**：Mini-Batch、Elkan（用三角不等式避免距离计算）。

### 9.3 实际应用案例

- **图像压缩 / 颜色量化**：把百万色压缩到 K 色（经典的 K=16 调色板）。
- **文档聚类 / 主题发现**：新闻、社交媒体分组。
- **客户分群**：RFM 分析、用户画像分层。
- **图像分割**：像素级聚类（SLIC 超像素即 K-Means 变体）。
- **特征学习**：用 K-Means 学视觉词袋（BoVW），深度学习之前的主流图像分类 pipeline。
- **推荐系统**：用户/物品聚类做粗排。
- **Spark MLlib / scikit-learn** 内置实现广泛使用。

### 9.4 当前现状（2024-2026）

- 仍是 K-Means 当道的简单场景，**仍是聚类的事实 baseline**。
- **Mini-Batch K-Means** 处理百万到亿级数据。
- **深度聚类**（Deep Clustering, Xie et al. 2016 DBC）结合自编码器和 K-Means 提升效果。
- **K-Means 在 GPU 上**（cuML、RapidsAI）实现 50-100x 加速。
- **Streaming K-Means**：在线聚类算法（CluStream、DenStream）处理持续到来的数据。
- **Spherical K-Means** 在文本、Embedding 聚类中持续使用（K-Means on unit sphere）。
- **LLM 时代**：用 LLM 提 embedding + K-Means 仍是最快的"主题发现"流程。

### 9.5 参考资料

- [Scikit-learn K-Means 文档](https://scikit-learn.org/stable/modules/clustering.html#k-means)
- [Lloyd 1982 论文](https://www.itu.dk/staff/sak/fulltext/1053.pdf)
- [K-Means++ 论文 (Arthur & Vassilvitskii 2007)](https://theory.stanford.edu/~sergei/papers/kMeansPP-soda.pdf)
- [Sculley 2010 Web-Scale K-Means](https://www.eecs.tufts.edu/~dsculley/papers/webkmeans.pdf)
- [《An Introduction to Statistical Learning》第12章](https://www.statlearning.com/)

---

## 10. DBSCAN

### 10.1 算法背景与历史

DBSCAN（Density-Based Spatial Clustering of Applications with Noise）开创了"密度聚类"流派：

- **1996 年**，**Martin Ester、Hans-Peter Kriegel、Jörg Sander、Xiaowei Xu** 在 KDD 会议发表 *"A Density-Based Algorithm for Discovering Clusters in Large Spatial Databases with Noise"*，DBSCAN 正式诞生。
- **1999 年**，**Ankerst 等人**提出 **OPTICS**（Ordering Points To Identify the Clustering Structure），是 DBSCAN 的扩展，能处理多密度。
- **2014 年**，**Campello、Moulavi、Sander** 提出 **HDBSCAN**（Hierarchical DBSCAN），自动选择 eps。
- **2015 年**，**McInnes、Healy、Astels** 等开源 **hdbscan** Python 库。
- **2017 年**，HDBSCAN 作者进一步把方法应用到 scikit-learn 生态。

里程碑论文：
- Ester, M., et al. (1996). "A Density-Based Algorithm for Discovering Clusters in Large Spatial Databases with Noise." *KDD*.
- Ankerst, M., et al. (1999). "OPTICS: Ordering Points To Identify the Clustering Structure." *SIGMOD*.
- Campello, R. J. G. B., et al. (2013). "Density-Based Clustering Based on Hierarchical Density Estimates." *PAKDD*.

### 10.2 算法详解

**核心思想**：基于"密度可达"定义簇。簇是密度相连点的最大集合，能被低密度区域分开。

**关键定义**：

- **ε-邻域**：$N_\varepsilon(p) = \{q \in D : \text{dist}(p, q) \leq \varepsilon\}$
- **核心点（Core Point）**：$|N_\varepsilon(p)| \geq \text{MinPts}$
- **边界点（Border Point）**：在某个核心点的 ε-邻域内但自己不是核心点
- **噪声点（Noise Point）**：既不是核心点也不是边界点
- **直接密度可达**：q 在 p 的 ε-邻域内且 p 是核心点。
- **密度可达**：存在链 p → ... → q，每对相邻点直接密度可达。
- **密度相连**：存在 o，使 p 和 q 都从 o 密度可达。

**算法流程**：

1. 任意选一个未访问点 p。
2. 找 p 的 ε-邻域。
3. 若 p 是核心点 → 创建新簇，递归把密度可达点加入。
4. 若 p 是边界点 → 标记为噪声（暂时）。
5. 若 p 是噪声点 → 标记为噪声。
6. 重复直到所有点处理完。

**关键参数**：

- **ε（eps）**：邻域半径。
- **MinPts**：核心点最少邻居数，常设 4-10。

**复杂度**：朴素实现 O(N²)，KD-Tree 加速 O(N log N)，最坏仍可能 O(N²)。

**优缺点**：

- 优点：不需要指定 K、发现任意形状、识别噪声、对异常鲁棒。
- 缺点：对密度不均数据差（→HDBSCAN）、高维困难、对参数敏感。

**HDBSCAN 扩展**：

- 不需要固定 ε，用 mutual reachability distance + 单链聚类 + cluster stability 提取。

### 10.3 实际应用案例

- **地理空间分析**：手机信令数据聚集、POI 划分。
- **异常检测**：DBSCAN 的"噪声点"就是异常值。
- **天文数据分析**：星系聚类。
- **图像处理**：手写识别预处理、图像去噪。
- **生物信息学**：单细胞 RNA-seq 数据聚类（与 Leiden/Louvain 算法并用）。
- **广告异常流量识别**：识别机器人聚集。
- **气候数据**：极端天气事件聚类。

### 10.4 当前现状（2024-2026）

- **HDBSCAN 几乎成为默认**：在大数据 / 异密度场景下，DBSCAN 的升级版 HDBSCAN 更受欢迎（`hdbscan` Python 库）。
- **GPU 加速版本**：cuML、Faiss-GPU 支持。
- **与深度学习结合**：DBSCAN 用于深度特征的聚类、对比学习中的负样本挖掘。
- **流式扩展**：DenStream、CluStream 等处理流数据。
- **在单细胞分析**中：与 Leiden 社区发现算法一起成为标准工具。
- **LLM 时代**：DBSCAN 用于 LLM 输出的语义去重、聚类。

### 10.5 参考资料

- [Scikit-learn DBSCAN 文档](https://scikit-learn.org/stable/modules/clustering.html#dbscan)
- [Ester et al. 1996 论文](https://www.aaai.org/Papers/KDD/1996/KDD96-037.pdf)
- [HDBSCAN 库](https://hdbscan.readthedocs.io/)
- [Campello et al. 2013 论文](https://link.springer.com/chapter/10.1007/978-3-642-37456-2_14)
- [《An Introduction to Statistical Learning》第12章](https://www.statlearning.com/)

---

## 11. 主成分分析（PCA）

### 11.1 算法背景与历史

PCA 是历史最悠久的降维/特征提取方法之一：

- **1901 年**，**Karl Pearson** 首次提出 PCA 的思想（独立于线性代数发展）。
- **1933 年**，**Harold Hotelling** 独立发展 PCA 并给出"主成分"名称。
- **1936 年**，**Fisher** 提出 **LDA**（线性判别分析），是有监督的类似想法。
- **1960-1970 年代**，**Karle 和 J. Karle** 在 X 射线晶体学中推广使用。
- **现代视角**：PCA 等价于对中心化数据矩阵做 SVD（奇异值分解），这是 1970-1980 年代才被广泛认识。
- **Kernel PCA**（Schölkopf et al. 1998）扩展到非线性。
- **Sparse PCA**（Zou et al. 2006）、**Robust PCA**（Candès et al. 2011）等扩展。

里程碑论文：
- Pearson, K. (1901). "On Lines and Planes of Closest Fit to Systems of Points in Space." *Philosophical Magazine*.
- Hotelling, H. (1933). "Analysis of a Complex of Statistical Variables into Principal Components." *Journal of Educational Psychology*.
- Schölkopf, B., Smola, A., & Müller, K. R. (1998). "Nonlinear Component Analysis as a Kernel Eigenvalue Problem." *Neural Computation*.

### 11.2 算法详解

**核心思想**：找一组正交方向（主成分），使数据在这些方向上的方差最大；保留前 k 个主成分即可近似重建原始数据。

**数学本质**：

- **最大化方差视角**：找投影方向 $w$ 使 $\text{Var}(w^\top x) = w^\top \Sigma w$ 最大，约束 $\|w\|=1$。
  - 解：对协方差矩阵 $\Sigma$ 做特征值分解，前 k 大特征值对应的特征向量即主成分。
- **最小化重建误差视角**：找子空间使 $\|x - W W^\top x\|^2$ 最小。
- **SVD 视角**：对中心化数据矩阵 $X_{n \times d}$ 做 SVD：$X = U \Sigma V^\top$，则 $V$ 的列即主成分方向。

**算法流程**：

1. 中心化 $X \leftarrow X - \bar{X}$。
2. 计算协方差矩阵 $\Sigma = \frac{1}{n} X^\top X$。
3. 特征值分解 $\Sigma = W \Lambda W^\top$。
4. 取前 k 大特征值对应的特征向量 $W_k$。
5. 投影 $X' = X W_k$。

**关键概念**：

- **解释方差比（Explained Variance Ratio）**：$\sum_{i=1}^{k} \lambda_i / \sum_{i=1}^{d} \lambda_i$。
- **特征值** = 主成分的方差；**特征向量** = 主成分方向。
- **白化（Whitening）**：除以 $\sqrt{\lambda_i}$ 让每个主成分方差为 1。
- **增量 PCA（Incremental PCA）**：分批处理大数据。
- **Kernel PCA**：用核函数隐式映射到高维后做 PCA，可捕捉非线性结构。

**PCA 的局限**：

- 只能捕捉**线性**结构。
- 解释方差最大 ≠ 类别可分性最大（→ LDA 是有监督的替代）。
- 对异常值敏感（→ Robust PCA, Candès et al. 2011）。
- 假设主成分正交（→ ICA 独立成分分析不要求正交）。

### 11.3 实际应用案例

- **人脸识别**：Eigenfaces（Turk & Pentland 1991）是 PCA 在人脸识别上的经典应用。
- **数据可视化**：高维数据降到 2D/3D 散点图。
- **去噪 / 去相关**：保留前 k 个主成分重建。
- **图像压缩**：保留主要成分，丢弃次要。
- **基因组学**：表达谱降维、群体结构分析（PCA on SNPs）。
- **金融**：协方差矩阵降维做风险因子分析。
- **神经科学**：fMRI 数据降维。

### 11.4 当前现状（2024-2026）

- 仍是**降维的事实 baseline**。
- **PCA 初始化**：在 K-Means 之前先做 PCA 经常提升效果。
- **神经网络中的 PCA**：白化层、独立成分分析（ICA）、Batch Normalization 等都借鉴 PCA 思想。
- **随机投影（Johnson-Lindenstrauss 1998）** 在极高维场景下作为更快替代。
- **在 LLM 时代**：分析 hidden states、attention head 的低维结构时仍用 PCA。
- **IncrementalPCA / SparsePCA / KernelPCA** 在 scikit-learn 中持续优化。
- **跨设备联邦 PCA** 用于隐私保护场景。

### 11.5 参考资料

- [Scikit-learn PCA 文档](https://scikit-learn.org/stable/modules/decomposition.html#pca)
- [《An Introduction to Statistical Learning》第12章](https://www.statlearning.com/)
- [《Deep Learning》第2章 Ian Goodfellow](https://www.deeplearningbook.org/)
- [Kernel PCA 论文 (Schölkopf et al. 1998)](https://www.mlpack.org/papers/kpca.pdf)
- [Eigenfaces 论文 (Turk & Pentland 1991)](https://www.face-rec.org/algorithms/PCA/jcn.pdf)

---

## 12. t-SNE / UMAP

### 12.1 算法背景与历史

非线性降维与可视化的代表方法：

- **Sammon 1969** 提出最早的**非线性降维**（Sammon Mapping）。
- **2000 年**，**Joshua Tenenbaum** 提出 **Isomap**（"A Global Geometric Framework for Nonlinear Dimensionality Reduction"），用测地距离替代欧氏距离。
- **2002 年**，**Sam Roweis 和 Lawrence Saul** 提出 **LLE（Locally Linear Embedding）**。
- **2008 年**，**Laurens van der Maaten 和 Geoffrey Hinton** 提出 **t-SNE**（"Visualizing Data using t-SNE"），至今引用 5 万+。
- **2018 年**，**Leland McInnes、John Healy、James Melville** 提出 **UMAP**（"UMAP: Uniform Manifold Approximation and Projection"），速度更快、全局结构更清晰。

里程碑论文：
- van der Maaten, L., & Hinton, G. (2008). "Visualizing Data using t-SNE." *JMLR*.
- McInnes, L., Healy, J., & Melville, J. (2018). "UMAP: Uniform Manifold Approximation and Projection for Dimension Reduction." *ArXiv*（后正式发表在 *IEEE Computational Intelligence Magazine* 2020）。
- Tenenbaum, J. B., et al. (2000). "A Global Geometric Framework for Nonlinear Dimensionality Reduction." *Science*.

### 12.2 算法详解

**核心思想**：把高维数据的**局部邻域结构**保留到低维（通常 2D/3D）做可视化。

**t-SNE 算法**：

1. 在高维空间，用高斯核定义相似度 $p_{ij}$（对称化）。
2. 在低维空间，用学生 t 分布（重尾）定义相似度 $q_{ij}$，避免"拥挤问题"。
3. 最小化 KL 散度 $\text{KL}(P \| Q) = \sum_{ij} p_{ij} \log \frac{p_{ij}}{q_{ij}}$。
4. 用梯度下降优化。

**关键概念**：

- **困惑度（perplexity）**：控制每个点的有效邻居数，常设 5-50。
- **学习率 / 迭代数**：影响收敛。
- **拥挤问题（Crowding Problem）**：高维空间的距离在低维难以保留，t 分布重尾让"远点"更宽容。
- **早压缩（Early Compression）与早夸张（Early Exaggeration）**：训练技巧。
- **梯度对称性**：梯度公式 = 排斥力 - 吸引力。

**UMAP 算法**：

1. 构造高维 fuzzy simplicial set（基于局部距离和邻居数）。
2. 寻找低维表示，使 fuzzy set 拓扑最相似。
3. 损失函数：交叉熵 $\sum_{ij} \left[ p_{ij} \log \frac{p_{ij}}{q_{ij}} + (1-p_{ij}) \log \frac{1-p_{ij}}{1-q_{ij}} \right]$。
4. 优化用随机梯度下降。

**关键概念**：

- **理论基础**：基于黎曼几何和代数拓扑（manifold assumption + fuzzy topological structure）。
- **n_neighbors / min_dist**：分别控制局部与全局。
- **可逆性**：与 t-SNE 不同，UMAP 支持 `inverse_transform`，可作为通用降维器。

**重要提醒**：

- 输出的图中，**簇间距离无严格意义**。
- 只能看"是否分得开"，不能直接说"A 簇比 B 簇离 C 簇更近"。
- 多次运行结果可能不同（随机初始化）。

### 12.3 实际应用案例

- **单细胞 RNA-seq 可视化**：scanpy 默认用 t-SNE/UMAP，Nature 论文标配。
- **NLP embedding 可视化**：Word2Vec、GloVe、BERT embedding 的二维投影。
- **图像特征可视化**：深度学习特征聚类后的可视化。
- **MNIST / Fashion-MNIST**：经典教学示例。
- **医学影像**：病灶分类后的可视化。
- **推荐系统**：用户/物品 embedding 可视化。
- **大模型内部表示**：分析不同层 hidden state 的结构。

### 12.4 当前现状（2024-2026）

- **UMAP 几乎取代 t-SNE** 成为默认：速度更快（~10x）、全局结构更好、可作为通用降维器。
- **Parametric UMAP / t-SNE**：用神经网络拟合降维函数，可嵌入到大模型训练中。
- **在大数据上**：使用 Barnes-Hut t-SNE、FFT-accelerated t-SNE 等加速。
- **PaCMAP**（Wang et al. 2021）是新的低维可视化方法，保留全局+局部。
- **在大模型时代**：用 UMAP 把 LLM embedding 降到 2D 检查聚类。
- **理论争议**：2024-2025 有多篇论文质疑 UMAP 保留全局结构的实际效果，引发对"trust the plot"原则的反思。

### 12.5 参考资料

- [t-SNE 论文 (van der Maaten & Hinton 2008)](http://www.jmlr.org/papers/v9/vandermaaten08a.html)
- [UMAP 论文 (McInnes et al. 2018)](https://arxiv.org/abs/1802.03426)
- [UMAP 官方文档](https://umap-learn.readthedocs.io/)
- [Distill.pub "How to Use t-SNE Effectively"](https://distill.pub/2016/misread-tsne/)
- [《An Introduction to Statistical Learning》第12章](https://www.statlearning.com/)

---

