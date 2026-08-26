<script setup>
import { ArrowRight, BarChart3, BrainCircuit, CheckCircle2, GraduationCap, HeartHandshake, ShieldCheck, Sparkles } from "lucide-vue-next";
</script>

<template>
  <div class="public-shell">
    <header class="public-header">
      <RouterLink class="brand-lockup" to="/">
        <img class="brand-mark" src="/assets/brand/para-kindergarten-logo.png" alt="ParaKindergarten" />
        <span><strong class="brand-name">ParaKindergarten</strong><small class="brand-subtitle">DIGITAL PRESCHOOL OPERATING SYSTEM</small></span>
      </RouterLink>
      <nav class="public-nav" aria-label="登录入口">
        <RouterLink to="/admin_login">管理员</RouterLink><RouterLink to="/login">教师</RouterLink><RouterLink to="/parent_login">家长</RouterLink><RouterLink to="/child_login">儿童</RouterLink>
      </nav>
    </header>
    <main>
      <section class="hero">
        <div>
          <span class="eyebrow">Preschool intelligence / 2026</span>
          <h1>把每一次成长，<em>连接成可见的未来。</em></h1>
          <p class="hero-copy">ParaKindergarten 将园所管理、课堂运营、家庭陪伴与儿童学习汇聚到一个轻盈的数字中枢，让每个角色都能更快看见下一步。</p>
          <div class="hero-actions"><RouterLink class="button button-primary" to="/admin_login">进入管理中枢 <ArrowRight :size="16" /></RouterLink><RouterLink class="button button-light" to="/parent_login">家长空间</RouterLink></div>
          <div style="display:flex; flex-wrap:wrap; gap:18px; margin-top:28px; color:#6b8795; font-size:12px"><span><CheckCircle2 :size="15" style="vertical-align:-3px; color:#1cafa5" /> 角色权限隔离</span><span><CheckCircle2 :size="15" style="vertical-align:-3px; color:#1cafa5" /> 数据实时同步</span><span><CheckCircle2 :size="15" style="vertical-align:-3px; color:#1cafa5" /> 移动端友好</span></div>
        </div>
        <div class="hero-panel" aria-label="系统状态预览">
          <div class="hero-panel-head"><span>PARA / CORE SIGNALS</span><span class="live-dot">LIVE</span></div>
          <div style="margin-top:55px"><span class="mono-label" style="color:#75d9d4">园所运行态势</span><h2 style="margin:8px 0 0; font-size:29px; letter-spacing:0">今天，孩子们正在发光。</h2><p style="margin:10px 0 0; color:#8eb5c4; font-size:13px; line-height:1.7">从签到到课堂，从成长记录到家庭反馈，每一条信号都被温柔地接住。</p></div>
          <div class="signal-grid"><div class="signal-card"><BarChart3 :size="18" color="#4de4d3" /><strong>98.6%</strong><span>今日出勤率</span><div class="signal-bar"><i style="width:98.6%" /></div></div><div class="signal-card"><BrainCircuit :size="18" color="#69a9ff" /><strong>24 / 7</strong><span>成长陪伴在线</span><div class="signal-bar"><i style="width:86%; background:#69a9ff" /></div></div></div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:30px; color:#86aebe; font:11px var(--font-mono)"><span><ShieldCheck :size="14" style="vertical-align:-3px; margin-right:5px; color:#c9f36b" /> SECURE BY DEFAULT</span><Sparkles :size="19" color="#c9f36b" /></div>
        </div>
      </section>
      <section style="max-width:1240px; margin:0 auto; padding:0 28px 72px; display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:14px">
        <article class="surface surface-pad" style="background:#fff"><GraduationCap :size="20" color="#14999c" /><h2 style="margin:18px 0 7px; font-size:16px; color:#1a455b">课堂与班级</h2><p style="margin:0; color:#6f8793; font-size:13px; line-height:1.7">学生、教师、班级和考勤在同一个清晰视图中流动。</p></article>
        <article class="surface surface-pad" style="background:#fff"><HeartHandshake :size="20" color="#ff7d8d" /><h2 style="margin:18px 0 7px; font-size:16px; color:#1a455b">家庭连接</h2><p style="margin:0; color:#6f8793; font-size:13px; line-height:1.7">家长随时了解孩子的状态，把园所和家庭连成一线。</p></article>
        <article class="surface surface-pad" style="background:#fff"><Sparkles :size="20" color="#6e9cf4" /><h2 style="margin:18px 0 7px; font-size:16px; color:#1a455b">成长智能</h2><p style="margin:0; color:#6f8793; font-size:13px; line-height:1.7">互动视频、AI 陪伴和语音能力，给孩子更多探索方式。</p></article>
      </section>
    </main>
    <footer style="max-width:1240px; margin:0 auto; padding:20px 28px 28px; border-top:1px solid #dce8ed; color:#8aa0aa; font-size:11px; display:flex; justify-content:space-between; gap:12px"><span>© 2026 ParaKindergarten</span><span>幼儿园数字化管理平台</span></footer>
  </div>
</template>
