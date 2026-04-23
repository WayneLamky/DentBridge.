import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { ArrowRight, Globe, FileText, CheckCircle, ChevronDown, MapPin } from 'lucide-react';

// 3D 场景懒加载，避免首屏阻塞
const ToothScene = lazy(() => import('./ToothScene.jsx'));

const EASE = 'cubic-bezier(0.16,1,0.3,1)';

// 是否偏好「减少动画」
const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Scroll-triggered reveal hook using Intersection Observer
function useReveal(threshold = 0.15) {
  const ref = useRef(null);
  // 若用户偏好减少动画，直接视为可见，跳过过渡
  const [visible, setVisible] = useState(() => prefersReducedMotion());

  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;
    // 无 IntersectionObserver（极老浏览器）兜底：直接显示
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.unobserve(el); } },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, visible]);

  return [ref, visible];
}

// Reusable reveal wrapper
function Reveal({ children, className = '', delay = 0, threshold = 0.12 }) {
  const [ref, visible] = useReveal(threshold);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(30px)',
        transition: `opacity 0.7s ${EASE} ${delay}s, transform 0.7s ${EASE} ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

const INITIAL_FORM = {
  name: '',
  wechat: '',
  email: '',
  education: '本科 (BDS/DDS)',
  experience: '应届 / 1年以内',
  language: '',
  destination: '',
};

const scrollToId = (id) => {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

export default function App() {
  const [openFaq, setOpenFaq] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [formError, setFormError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const faqs = [
    { id: 'lang', q: "我必须先考取雅思/OET才能开始准备吗？", a: "不一定。例如申请香港部分执业路径可豁免语言成绩；英澳虽需语言，但可以在学历审核（如ORE Part 1前）同步准备。" },
    { id: 'exp', q: "国内民营诊所的执业经验被海外认可吗？", a: "是的，只要具备国内合法的执业医师资格证及执业证，正规民营诊所的工作经验同样可作为执业年限证明。" },
    { id: 'cost', q: "整个流程的费用大概需要多少？", a: "根据目的国家不同差异较大。主要包含资质评估费、考试报名费及签证等硬性支出，通常在 5-10 万人民币区间浮动。" }
  ];

  const updateField = (key) => (e) => {
    setFormData((prev) => ({ ...prev, [key]: e.target.value }));
    if (formError) setFormError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('请填写您的姓名');
      return;
    }
    if (!formData.wechat.trim() && !formData.email.trim()) {
      setFormError('请至少填写微信号或邮箱，以便我们联系您');
      return;
    }
    if (!formData.destination) {
      setFormError('请选择一个意向目的地');
      return;
    }
    setFormError('');
    // eslint-disable-next-line no-console
    console.log('[DentBridge] 表单已提交:', formData);
    setSubmitted(true);
  };

  const resetForm = () => {
    setFormData(INITIAL_FORM);
    setFormError('');
    setSubmitted(false);
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-neutral-700">
      {/* Navigation */}
      <nav className="fixed top-0 w-full flex items-center justify-between px-6 py-4 z-[60] mix-blend-difference">
        <div className="text-xl font-bold tracking-tighter">DentBridge.</div>
        <div className="hidden md:flex items-center space-x-8 text-sm font-medium">
          <button type="button" onClick={() => scrollToId('destinations')} className="hover:opacity-70 transition-opacity">目的地对标</button>
          <button type="button" onClick={() => scrollToId('assessment')} className="hover:opacity-70 transition-opacity">路径评估</button>
          <button type="button" onClick={() => scrollToId('cases')} className="hover:opacity-70 transition-opacity">成功案例</button>
        </div>
        <button
          type="button"
          onClick={() => scrollToId('assessment')}
          className="bg-white text-black px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-neutral-200 hover:scale-[1.03] transition-all duration-300 ease-out"
        >
          免费获取评估
        </button>
      </nav>

      {/* Hero — 3D 牙齿背景 + 文案 */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">
        {/* 径向光晕背景，衬托 3D 模型 */}
        <div
          aria-hidden="true"
          className="absolute inset-0 z-0"
          style={{
            background:
              'radial-gradient(circle at 50% 55%, rgba(96,165,250,0.18) 0%, rgba(0,0,0,0) 55%), radial-gradient(circle at 20% 80%, rgba(251,191,36,0.12) 0%, rgba(0,0,0,0) 50%)',
          }}
        />

        {/* 3D 牙齿画布 */}
        <div className="absolute inset-0 z-0">
          <Suspense fallback={null}>
            <ToothScene />
          </Suspense>
        </div>

        {/* 文案层：指针事件穿透，避免遮住 3D 交互，按钮/链接单独恢复 */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 flex flex-col items-center text-center py-32 pointer-events-none">
          <Reveal>
            <div className="inline-block border border-neutral-700/80 bg-black/30 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm mb-8 text-neutral-300 uppercase tracking-widest">
              为中国牙医连接海外留学、执业与落地路径
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <h1 className="text-6xl md:text-7xl lg:text-[6.5rem] font-bold tracking-tighter leading-none mb-8 drop-shadow-[0_4px_24px_rgba(0,0,0,0.6)]">
              搭建通往<br />
              <span className="text-neutral-400">海外执业的桥梁</span>
            </h1>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="text-lg md:text-xl text-neutral-300 max-w-2xl mb-14 font-light leading-relaxed drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]">
              Bridging Your Dental Career Globally. <br className="hidden md:block" />
              连接留学申请、执业考试与海外落地的一站式牙医平台。
            </p>
          </Reveal>
          <Reveal delay={0.3}>
            <button
              type="button"
              onClick={() => scrollToId('assessment')}
              className="pointer-events-auto bg-[#E5E7EB] text-black px-8 py-4 rounded-full text-lg font-semibold flex items-center space-x-2 hover:bg-white hover:scale-105 transition-all duration-300 ease-out shadow-xl"
            >
              <span>开始路线评估</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </Reveal>
        </div>

        {/* 滚动指示 */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 text-neutral-500 text-xs uppercase tracking-widest flex flex-col items-center gap-2 animate-pulse">
          <span>Scroll</span>
          <ChevronDown className="w-4 h-4" />
        </div>
      </section>

      {/* Destination Comparison */}
      <section id="destinations" className="relative bg-[#F4F4F5] text-black rounded-t-[3rem] px-6 py-32 scroll-mt-24">
        <div className="max-w-7xl mx-auto">
          <Reveal>
            <div className="mb-20">
              <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter leading-none mb-4">热门执业地对比</h2>
              <p className="text-xl text-neutral-500 font-medium uppercase tracking-widest">Compare Destinations. 理性决策，清晰规划。</p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* HK */}
            <Reveal delay={0}>
              <div className="bg-white rounded-3xl p-8 shadow-sm flex flex-col h-full border border-neutral-100 hover:scale-[1.02] hover:shadow-md transition-all duration-300 ease-out">
                <div className="mb-8">
                  <span className="bg-black text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">Priority</span>
                </div>
                <h3 className="text-3xl font-bold tracking-tight mb-2">香港特别行政区</h3>
                <p className="text-neutral-400 text-sm font-medium mb-6 uppercase tracking-widest">Hong Kong SAR</p>
                <ul className="space-y-4 mb-8 flex-grow">
                  <li className="flex items-start"><CheckCircle className="w-5 h-5 mr-3 flex-shrink-0 text-black" /><span>无需语言成绩 (豁免雅思)</span></li>
                  <li className="flex items-start"><CheckCircle className="w-5 h-5 mr-3 flex-shrink-0 text-black" /><span>薪资待遇极具竞争力</span></li>
                  <li className="flex items-start"><CheckCircle className="w-5 h-5 mr-3 flex-shrink-0 text-black" /><span>文化认同感强，地理位置优越</span></li>
                </ul>
                <div className="pt-6 border-t border-neutral-100 mt-auto">
                  <p className="text-sm text-neutral-500">难度：★★★☆☆ <br/>周期：1-2年</p>
                </div>
              </div>
            </Reveal>

            {/* UK */}
            <Reveal delay={0.15}>
              <div className="bg-neutral-900 text-white rounded-3xl p-8 shadow-sm flex flex-col h-full hover:scale-[1.02] hover:shadow-md transition-all duration-300 ease-out">
                <div className="mb-8">
                  <span className="bg-neutral-700 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">Priority</span>
                </div>
                <h3 className="text-3xl font-bold tracking-tight mb-2">英国</h3>
                <p className="text-neutral-400 text-sm font-medium mb-6 uppercase tracking-widest">United Kingdom</p>
                <ul className="space-y-4 mb-8 flex-grow text-neutral-300">
                  <li className="flex items-start"><CheckCircle className="w-5 h-5 mr-3 flex-shrink-0 text-white" /><span>ORE 考试体系成熟标准</span></li>
                  <li className="flex items-start"><CheckCircle className="w-5 h-5 mr-3 flex-shrink-0 text-white" /><span>公私立医疗系统双规发展</span></li>
                  <li className="flex items-start"><CheckCircle className="w-5 h-5 mr-3 flex-shrink-0 text-white" /><span>Work-Life Balance 优异</span></li>
                </ul>
                <div className="pt-6 border-t border-neutral-800 mt-auto">
                  <p className="text-sm text-neutral-400">难度：★★★★☆ <br/>周期：2-3年</p>
                </div>
              </div>
            </Reveal>

            {/* AUS */}
            <Reveal delay={0.3}>
              <div className="bg-[#E2E8F0] text-black rounded-3xl p-8 shadow-sm flex flex-col h-full hover:scale-[1.02] hover:shadow-md transition-all duration-300 ease-out">
                <div className="mb-8">
                  <span className="bg-black text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">Priority</span>
                </div>
                <h3 className="text-3xl font-bold tracking-tight mb-2">澳大利亚</h3>
                <p className="text-neutral-500 text-sm font-medium mb-6 uppercase tracking-widest">Australia</p>
                <ul className="space-y-4 mb-8 flex-grow">
                  <li className="flex items-start"><CheckCircle className="w-5 h-5 mr-3 flex-shrink-0 text-black" /><span>ADC 考试通过后直通执业</span></li>
                  <li className="flex items-start"><CheckCircle className="w-5 h-5 mr-3 flex-shrink-0 text-black" /><span>极佳的自然环境与生活质量</span></li>
                  <li className="flex items-start"><CheckCircle className="w-5 h-5 mr-3 flex-shrink-0 text-black" /><span>清晰的职业移民双通道</span></li>
                </ul>
                <div className="pt-6 border-t border-neutral-300 mt-auto">
                  <p className="text-sm text-neutral-600">难度：★★★★★ <br/>周期：2-4年</p>
                </div>
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.2}>
            <div className="mt-8 flex justify-end">
              <p className="text-sm text-neutral-500 flex items-center">
                <MapPin className="w-4 h-4 mr-1" />
                即将开启: <span className="mx-2 font-medium text-black">加拿大 (Canada)</span> | <span className="ml-2 font-medium text-black">美国 (United States)</span>
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Route Assessment */}
      <section id="assessment" className="relative bg-white px-6 py-32 scroll-mt-24">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-16 items-start">
          <div className="w-full lg:w-2/5 lg:sticky lg:top-32">
            <Reveal>
              <h2 className="text-5xl md:text-6xl font-bold tracking-tighter leading-none mb-6 text-black">获取您的专属路线图</h2>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="text-lg text-neutral-600 mb-10 leading-relaxed">
                Route Assessment. 告诉我们您的背景与期望，我们的专业规划师将在24小时内为您提供一份详尽的海外执业可行性报告。
              </p>
            </Reveal>
            <Reveal delay={0.2}>
              <div className="space-y-6">
                <div className="flex items-center text-neutral-700">
                  <div className="bg-[#F4F4F5] p-3 rounded-2xl mr-4"><FileText className="w-6 h-6" /></div>
                  <div>
                    <h4 className="font-bold text-black">全案资质审核</h4>
                    <p className="text-sm">评估学历、执业年限及语言基础</p>
                  </div>
                </div>
                <div className="flex items-center text-neutral-700">
                  <div className="bg-[#F4F4F5] p-3 rounded-2xl mr-4"><Globe className="w-6 h-6" /></div>
                  <div>
                    <h4 className="font-bold text-black">最优考区匹配</h4>
                    <p className="text-sm">基于个人诉求推荐最合适的国家及豁免路线</p>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.15} className="w-full lg:w-3/5">
            <div className="bg-[#F4F4F5] rounded-[2.5rem] p-8 md:p-12 shadow-sm">
              <form className="space-y-6" onSubmit={handleSubmit} noValidate>
                {/* 组1：基本联系信息 */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="f-name" className="block text-sm font-semibold mb-2 text-black">姓名 Name</label>
                      <input
                        id="f-name"
                        type="text"
                        autoComplete="name"
                        value={formData.name}
                        onChange={updateField('name')}
                        disabled={submitted}
                        className="w-full bg-white px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-black border border-transparent transition-all text-black disabled:opacity-60"
                        placeholder="您的称呼"
                      />
                    </div>
                    <div>
                      <label htmlFor="f-wechat" className="block text-sm font-semibold mb-2 text-black">微信号 WeChat</label>
                      <input
                        id="f-wechat"
                        type="text"
                        value={formData.wechat}
                        onChange={updateField('wechat')}
                        disabled={submitted}
                        className="w-full bg-white px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-black border border-transparent transition-all text-black disabled:opacity-60"
                        placeholder="以便及时沟通"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="f-email" className="block text-sm font-semibold mb-2 text-black">电子邮箱 Email</label>
                    <input
                      id="f-email"
                      type="email"
                      autoComplete="email"
                      value={formData.email}
                      onChange={updateField('email')}
                      disabled={submitted}
                      className="w-full bg-white px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-black border border-transparent transition-all text-black disabled:opacity-60"
                      placeholder="用于接收您的专属评估报告（PDF）"
                    />
                  </div>
                </div>

                <hr className="border-neutral-200" />

                {/* 组2：专业背景 & 语言能力 */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="f-edu" className="block text-sm font-semibold mb-2 text-black">最高学历 Education</label>
                      <select
                        id="f-edu"
                        value={formData.education}
                        onChange={updateField('education')}
                        disabled={submitted}
                        className="w-full bg-white px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-black border border-transparent appearance-none transition-all text-black disabled:opacity-60"
                      >
                        <option>本科 (BDS/DDS)</option>
                        <option>硕士 (Master)</option>
                        <option>博士 (PhD)</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="f-exp" className="block text-sm font-semibold mb-2 text-black">执业年限 Experience</label>
                      <select
                        id="f-exp"
                        value={formData.experience}
                        onChange={updateField('experience')}
                        disabled={submitted}
                        className="w-full bg-white px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-black border border-transparent appearance-none transition-all text-black disabled:opacity-60"
                      >
                        <option>应届 / 1年以内</option>
                        <option>1-3年</option>
                        <option>3-5年</option>
                        <option>5年以上</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <span className="block text-sm font-semibold mb-2 text-black">语言能力 Language Proficiency</span>
                    <div className="grid grid-cols-3 gap-3">
                      {['雅思 (IELTS)', '托福 (TOEFL)', '暂无成绩'].map((item) => (
                        <label
                          key={item}
                          className={`flex items-center justify-center bg-white py-3 px-2 rounded-xl border cursor-pointer transition-all duration-300 ease-out text-center ${
                            formData.language === item ? 'border-black ring-2 ring-black' : 'border-transparent hover:border-black hover:scale-[1.03]'
                          } ${submitted ? 'opacity-60 pointer-events-none' : ''}`}
                        >
                          <input
                            type="radio"
                            name="language"
                            value={item}
                            checked={formData.language === item}
                            onChange={updateField('language')}
                            className="sr-only"
                          />
                          <span className="font-medium text-xs md:text-sm text-black">{item}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <hr className="border-neutral-200" />

                {/* 组3：意向目的地 */}
                <div>
                  <span className="block text-sm font-semibold mb-2 text-black uppercase tracking-widest text-xs">意向目的地 Destination</span>
                  <div className="grid grid-cols-3 gap-3">
                    {['香港', '英国', '澳洲'].map((dest) => (
                      <label
                        key={dest}
                        className={`flex items-center justify-center bg-white py-3 rounded-xl border cursor-pointer transition-all duration-300 ease-out ${
                          formData.destination === dest ? 'border-black ring-2 ring-black' : 'border-transparent hover:border-black hover:scale-[1.03]'
                        } ${submitted ? 'opacity-60 pointer-events-none' : ''}`}
                      >
                        <input
                          type="radio"
                          name="dest"
                          value={dest}
                          checked={formData.destination === dest}
                          onChange={updateField('destination')}
                          className="hidden"
                        />
                        <span className="font-medium text-sm text-black">{dest}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {formError && (
                  <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                    {formError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitted}
                  className="w-full bg-black text-white font-bold py-4 rounded-xl mt-4 hover:bg-neutral-800 hover:scale-[1.02] active:scale-[0.98] hover:shadow-md transition-all duration-300 ease-out shadow-sm disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {submitted ? '✓ 已收到，我们将在 24 小时内联系您' : '提交并接收评估报告'}
                </button>

                {submitted && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="w-full mt-3 text-sm font-semibold text-black underline underline-offset-4 hover:text-neutral-600 transition-colors"
                  >
                    再提交一份
                  </button>
                )}

                <p className="text-xs text-center text-neutral-400 mt-4">
                  点击提交即代表您同意 DentBridge 的隐私政策，我们将向您的邮箱发送自动化评估结果。
                </p>
              </form>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Cases & FAQ */}
      <section id="cases" className="relative bg-black text-white rounded-t-[3rem] px-6 py-32 scroll-mt-24">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            {/* Success Case */}
            <div>
              <Reveal>
                <h2 className="text-4xl font-bold tracking-tighter mb-8">案例集锦 <span className="text-neutral-500 text-lg font-normal ml-2 uppercase tracking-widest">Success Cases</span></h2>
              </Reveal>
              <Reveal delay={0.15}>
                <div className="bg-neutral-900 rounded-3xl p-8 border border-neutral-800">
                  <p className="text-lg leading-relaxed text-neutral-300 mb-6 italic">
                    "系统的指导帮助我避开了 ORE 考试初期材料审核的许多弯路。从国内公立医院到伦敦私人诊所，整个转换期比预期缩短了整整半年。"
                  </p>
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-neutral-700 rounded-full mr-4"></div>
                    <div>
                      <h4 className="font-bold">Dr. Lin</h4>
                      <p className="text-sm text-neutral-500">2023 成功注册英国 GDC</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>

            {/* FAQ */}
            <div>
              <Reveal>
                <h2 className="text-4xl font-bold tracking-tighter mb-8">常见问题 <span className="text-neutral-500 text-lg font-normal ml-2 uppercase tracking-widest">FAQs</span></h2>
              </Reveal>
              <div className="space-y-4">
                {faqs.map((faq, i) => {
                  const isOpen = openFaq === faq.id;
                  return (
                    <Reveal key={faq.id} delay={0.1 + i * 0.1}>
                      <button
                        type="button"
                        onClick={() => setOpenFaq(isOpen ? null : faq.id)}
                        aria-expanded={isOpen}
                        className="w-full text-left bg-neutral-900 rounded-2xl p-6 cursor-pointer hover:bg-neutral-800 hover:scale-[1.02] transition-all duration-300 ease-out border border-neutral-800"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-semibold pr-4">{faq.q}</span>
                          <ChevronDown className={`w-5 h-5 text-neutral-500 flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                        </div>
                        {isOpen && (
                          <p className="mt-4 text-neutral-400 text-sm leading-relaxed">{faq.a}</p>
                        )}
                      </button>
                    </Reveal>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer — final layer */}
      <footer className="relative bg-black text-neutral-500 py-16 px-6 border-t border-neutral-900">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="text-2xl font-bold text-white tracking-tighter mb-4 md:mb-0">DentBridge.</div>
          <div className="flex space-x-6 text-sm">
            <button type="button" className="hover:text-white transition-colors">关于我们</button>
            <button type="button" className="hover:text-white transition-colors">隐私政策</button>
            <button type="button" className="hover:text-white transition-colors">服务条款</button>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-8 text-xs text-center md:text-left">
          © 2026 DentBridge Global Dental Network. All rights reserved. <br/>
          Not an official government immigration body. Assessment results are for informational purposes only.
        </div>
      </footer>
    </div>
  );
}
