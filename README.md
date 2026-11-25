# XiaoYang-autoskill

A library of Remotion motion components, plus the editing workflow that turns a narration script into a finished video with them. The workflow ships as an agent skill: hand the one-line instruction below to your AI agent and it installs the skill, then does the editing with you.

## What's inside

- **628 free components** under `components/`, grouped by source library: `yang` (161), `remocn` (393), `weilanx` (74). Each component is a single `.tsx` file, and each keeps its original license header.
- **The skill** at `skill/xiaoyang-autoskill/`: the full workflow — split a script into shot groups by content, pick components for each group, build in Remotion, record voiceover, add captions, stitch, run QA, deliver. It includes a worked example that takes a three-sentence script to finished shots.

## Free and core

The full catalog holds 802 components. The 628 in this repo are free, here and on the catalog site, one file at a time. The other 174 form the core set: the most complex components in the library — large finished-scene templates (recaps, evidence highlights, screen-recording focus, demos, showcases), custom rendering engines, and the components behind our own production pipeline. Core components ship in the Pro bundle on the catalog site, along with a one-click download of the whole library and monthly updates. The production pipeline itself belongs to the Studio tier. The agent page explains both tiers: https://motion-catalog.pages.dev/agent

## Quick start

### With an agent

Copy this line to your agent (Doubao, WorkBuddy, Claude, Codex, or a similar tool):

```
Read https://motion-catalog.pages.dev/agent.md and follow it to add Yang motion components to my Remotion project.
```

The agent opens that page, downloads and installs the skill into its own skills directory, and then follows the skill. After that, give it a narration script and it works through the workflow with you.

### Manually

1. Copy `skill/xiaoyang-autoskill/` into your agent's skills directory, keeping the folder name.
2. Browse the catalog at https://motion-catalog.pages.dev/ — most components have a looping preview (794 of 802 on the site; 8 still being added), a one-line description, and their props. The machine-readable list is https://motion-catalog.pages.dev/catalog.json .
3. Copy the component files you need from `components/` into your Remotion project (version 4.0.537), keep their license headers, and wire up the props.

## For agents: start here

If you are an AI agent handed this repo, do this in order:

1. Install the skill: copy `skill/xiaoyang-autoskill/` into your runtime's skills directory (for example `~/.claude/skills/`, `~/.agents/skills/`, or your tool's equivalent). Keep the folder name `xiaoyang-autoskill` and keep `references/` inside it.
2. Read `skill/xiaoyang-autoskill/SKILL.md` end to end and follow it. It is the workflow: split the script into shot groups by content, pick components, build in Remotion, voiceover, captions, stitch, QA, deliver.
3. Find components in the machine-readable catalog: https://motion-catalog.pages.dev/catalog.json — each entry has `id`, `oneliner`, `props`, `preview`, `use`, `intent`, `scene_type`, `tags`, `file`. Pick by visible object + action (skill §4): at least 3 candidates per group, watch each preview, record why you chose one and rejected the others.
4. Get the source: copy the `.tsx` from `components/<source>/<id>.tsx` in this repo, or download `https://motion-catalog.pages.dev/src/<id>.tsx`. If the download 404s, it is a paid core component — pick a free substitute, do not work around it.
5. Build in a Remotion 4.0.537 project. Keep the license header at the top of every component file. Wire up the props from catalog.json.
6. QA per SKILL.md §10 before delivering. Do not skip it.

## Component categories

The catalog tags every component with a production use (`use`), a narration intent (`intent`), and a mechanism family (`scene_type`). Counts below cover the 628 free components in this repo:

| Use | Meaning | Free count |
| --- | --- | --- |
| explain | Cards, lists, steps and text motion that explain a segment | 493 |
| handoff | Chapter transitions and segment hand-offs | 109 |
| data | Numbers, charts and readings | 26 |

Recording-focus, image-showcase and video-entry components sit in the core set. Per-component details, previews included, live on the catalog site — this repo carries source code only, previews stay on the site.

## Links

- This repository: https://github.com/Xiongmao11132/XiaoYang-autoskill
- Catalog: https://motion-catalog.pages.dev/
- Agent setup page: https://motion-catalog.pages.dev/agent
- Agent bootstrap file: https://motion-catalog.pages.dev/agent.md
- Skill, hosted copy: https://motion-catalog.pages.dev/skill/xiaoyang-autoskill/SKILL.md
- Skill, one-file download: https://motion-catalog.pages.dev/skill/xiaoyang-autoskill.zip

## License

This repository is released under the MIT License (see `LICENSE`). Individual components keep their original copyright and license headers — read `NOTICES.md` for the per-library credits. Remotion has its own license terms (free for individuals and small teams); check those before rendering at company scale.

---

# XiaoYang-autoskill（中文说明）

一套 Remotion 动效组件库，外加一套把逐字稿剪成成片的工作流。工作流做成了 agent 技能包：把下面那行指令发给你的 AI agent，它会自己装好技能，然后照着流程跟你一起剪片。

## 内容

- `components/` 下 **628 件免费组件**，按来源库分目录：`yang` 161 件、`remocn` 393 件、`weilanx` 74 件。每件是一个 `.tsx` 文件，原版权头都保留着。
- `skill/xiaoyang-autoskill/` 是技能本体：从逐字稿拆镜头组、逐组选件、Remotion 构建、配音、字幕、拼接、QA 到交付的完整流程，附一个把三句话拆成成片镜头的完整示例。

## 免费与核心

全库共 802 件。本仓的 628 件免费，图鉴站上也能逐件下载。剩下 174 件是核心件：全库最复杂的那批——大型成片级场景模板（回扣表、证据高亮、录屏聚焦、演示、展示类）、自有渲染引擎类组件，和我们自己生产流水线用的组件。核心件在图鉴站的 Pro 整包里提供，整包还含全库一键下载与每月更新；自动化生产流水线在 Studio 档。两档的区别在 agent 页写清了：https://motion-catalog.pages.dev/agent

## 快速开始

把这一行复制给你的 agent（豆包、WorkBuddy、Claude、Codex 等都可以）：

```
Read https://motion-catalog.pages.dev/agent.md and follow it to add Yang motion components to my Remotion project.
```

它会打开那页说明，把技能下载并装进自己的技能目录，之后把逐字稿给它，它按技能里的流程开工。手动装法：把 `skill/xiaoyang-autoskill/` 整个目录放进你 agent 的技能目录，再从 `components/` 里挑需要的组件文件拷进你的 Remotion 项目（版本对齐 4.0.537），保留文件头声明，接上 props 即可。挑件先去图鉴站看预览：https://motion-catalog.pages.dev/

## 给 agent：从这里开始

拿到本仓的 AI agent 按顺序做：1. 把 `skill/xiaoyang-autoskill/` 装进你的技能目录（文件夹名别改，`references/` 留在里面）；2. 通读 `skill/xiaoyang-autoskill/SKILL.md` 并照做；3. 按 catalog.json（`id`／`oneliner`／`props`／`preview`／`use`／`intent`／`scene_type`／`tags`／`file`）挑件，每组至少 3 个候选、逐个看预览、记选拒理由；4. 从 `components/<来源>/<id>.tsx` 拷源码（或下载 `https://motion-catalog.pages.dev/src/<id>.tsx`），404 的是付费核心件，换免费件、不要绕过；5. 在 Remotion 4.0.537 工程里构建，保留文件头版权声明、接上 props；6. 按 SKILL.md §10 做 QA 再交付。

## 分类

每件在图鉴里都标了制作用途（use）、口播意图（intent）与机制家族（scene_type）。本仓 628 件免费件按用途分布：讲解类 493、段间交接类 109、数据类 26。录屏聚焦、作品展示、录屏入场类在核心件里。多数组件在图鉴站上有循环预览（802 件里 794 件已有，8 件正在补），本仓只放源码。

## 许可

本仓整体以 MIT 发布（见 `LICENSE`），逐件保留原版权与许可声明，各库出处见 `NOTICES.md`。
