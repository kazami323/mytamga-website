// REVIEW(translation): draft — must be checked by a native speaker before launch.
// Simplified Chinese, as used on the mainland.
import type { Dictionary } from "./ru";

const P = "占位文本";

export const zh: Dictionary = {
  meta: {
    title: "MyTamga — 从货物到报关员，进口清晰明了",
    description: "MyTamga 帮助您确定 HS 编码、计算海关税费、核查商品要求，并为后续清关准备好所需的一切。",
  },
  placeholder: P,
  nav: {
    home: "首页",
    services: "服务",
    calc: "计算",
    about: "关于我们",
    contacts: "联系方式",
    primary: "主导航",
    footer: "页脚导航",
    openMenu: "打开菜单",
    closeMenu: "关闭菜单",
    language: "语言",
  },
  theme: {
    light: "浅色主题",
  },
  preloader: {
    loading: "页面加载中",
  },
  hero: {
    kicker: P,
    title: ["进口，清晰明了——", "从货物", "到报关员。"],
    lead: "MyTamga 帮助您确定 HS 编码、计算海关税费、核查商品要求，并为后续清关准备好所需的一切。",
    actions: "主要操作",
    contact: "联系我们",
    learnMore: "了解我们",
    sceneLoading: "场景加载中",
  },
  capabilities: {
    kicker: "服务范围",
    title: "提交报关单前所需的一切",
    items: [
      { id: "code", title: "HS 编码", body: "根据商品的描述、成分和用途确定商品编码。" },
      { id: "payments", title: "税费计算", body: "我们提前计算海关税费，让您在申报前就了解进口成本。" },
      { id: "requirements", title: "商品要求", body: "核查您的商品具体需要哪些许可文件。" },
      { id: "documents", title: "文件准备", body: "我们整理好文件包，您只需交给报关员办理后续手续。" },
    ],
  },
  howItWorks: {
    kicker: "服务流程",
    title: "三步完成文件包",
    steps: [
      { id: "describe", title: "描述商品", body: "名称、成分、用途及原产国。" },
      { id: "receive", title: "获取编码和税费", body: "HS 编码和海关税费——申报前即可知晓。" },
      { id: "collect", title: "领取文件", body: "只需将文件包交给报关员即可。" },
    ],
  },
  calculation: {
    kicker: "税费计算",
    title: "计算所需信息",
    inputs: [
      { id: "goods", title: "商品描述", body: "名称、成分和用途。" },
      { id: "origin", title: "原产国", body: "决定适用的税率。" },
      { id: "value", title: "完税价格", body: "成交价格及相关费用。" },
      { id: "weight", title: "重量和体积", body: "毛重、净重及货物尺寸。" },
    ],
    resultKicker: "您将获得",
    results: [
      { id: "result-1", title: P, body: P },
      { id: "result-2", title: P, body: P },
      { id: "result-3", title: P, body: P },
    ],
    cta: "提交申请",
  },
  about: {
    kicker: "关于我们",
    title: P,
    body: P,
    facts: [
      { id: "fact-1", label: P, value: P },
      { id: "fact-2", label: P, value: P },
      { id: "fact-3", label: P, value: P },
    ],
  },
  contact: {
    kicker: "联系方式",
    title: "告诉我们您的商品",
    body: "请描述您要运输的货物。我们将回复 HS 编码和税费计算。",
    channels: [
      { id: "phone", label: "电话", value: P, href: null },
      { id: "email", label: "电子邮箱", value: P, href: null },
      { id: "place", label: "地址", value: P, href: null },
    ],
  },
  form: {
    name: "姓名",
    contact: "电话或邮箱",
    company: "公司",
    goods: "运输的货物",
    goodsPlaceholder: "名称、成分、用途、原产国。",
    optional: "选填",
    submit: "提交申请",
    sending: "正在提交…",
    unavailable: "在线申请尚未开通。请通过旁边的联系方式与我们联系——您填写的内容已保留。",
    failed: "提交失败。请重试或直接联系我们。",
    errors: {
      "name.short": "请输入姓名——至少 2 个字符。",
      "name.long": "姓名过长。",
      "contact.missing": "请留下电话或邮箱。",
      "contact.invalid": "这看起来不像电话或邮箱。",
      "company.long": "公司名称过长。",
      "goods.short": "请描述商品——至少 10 个字符。",
      "goods.long": "描述过长。",
    },
  },
  footer: {
    legal: P,
  },
};
