"use strict";(()=>{var G=`
  .si-btn:hover { filter: brightness(1.12); }
  .si-input { outline: none; }
  .si-input:focus { outline: 2px solid #1e2d5a; outline-offset: -1px; }
  .si-input-light { outline: none; }
  .si-input-light:focus { outline: 2px solid #111827; outline-offset: -1px; }
`;function h(){if(document.getElementById("si-styles"))return;let e=document.createElement("style");e.id="si-styles",e.textContent=G,document.head.appendChild(e)}var c={subscribed:"si_subscribed",email:"si_email",subscriberId:"si_sid",gates:"si_gates",exitShown:"si_exit_shown",tracked:"si_tracked"};function m(){return localStorage.getItem(c.subscribed)==="true"}function v(){return localStorage.getItem(c.email)}function w(e,t){localStorage.setItem(c.subscribed,"true"),localStorage.setItem(c.email,e),localStorage.setItem(c.subscriberId,t)}function S(){var e;try{return JSON.parse((e=localStorage.getItem(c.gates))!=null?e:"[]")}catch(t){return[]}}function E(e){let t=S();t.includes(e)||localStorage.setItem(c.gates,JSON.stringify([...t,e]))}function k(e){return S().includes(e)}function M(){var e;try{return JSON.parse((e=localStorage.getItem(c.tracked))!=null?e:"[]")}catch(t){return[]}}function T(e){return M().includes(e)}function L(e){let t=M();t.includes(e)||localStorage.setItem(c.tracked,JSON.stringify([...t,e]))}function b(){return sessionStorage.getItem(c.exitShown)==="true"}function I(){sessionStorage.setItem(c.exitShown,"true")}var $,H,C,A,B=(A=(C=($=document.currentScript)==null?void 0:$.dataset.api)!=null?C:(H=document.querySelector("script[data-api]"))==null?void 0:H.dataset.api)!=null?A:"https://engage.shouldit.com/api";function x(){return B}async function u(e,t,n,i,r){let s=await(await fetch(`${x()}/subscribe`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:e,attributes:{product_id:t,category:n,intent:i,current_price:r}})})).json();return s.success&&w(e,""),s}async function z(){let e=x(),t=window.location.pathname.replace(/^\/|\/$/g,"");if(!t)return[];try{let n=await fetch(`${e}/widget-meta?best=${encodeURIComponent(t)}`,{signal:AbortSignal.timeout(4e3)});return n.ok?n.json():[]}catch(n){return[]}}async function P(e){fetch(`${x()}/track-click`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:localStorage.getItem("si_email"),productId:e,pageUrl:location.href})}).catch(()=>{})}var g="font-family:ui-sans-serif,system-ui,sans-serif;font-size:14px;color:#111827;box-sizing:border-box",W="display:flex;gap:8px;flex-wrap:wrap",f=(e,t)=>`<input data-si="email" class="${t}"
    style="flex:1;min-width:180px;padding:8px 12px;border:1px solid #d1d5db;border-radius:6px;font-size:14px;background:white;font-family:inherit;color:#111827"
    type="email" placeholder="your@email.com"
    value="${e!=null?e:""}"
    aria-label="Email address" />`,j={buying:{default:(e,t)=>{let n=document.createElement("div");return n.setAttribute("style",`${g};background:#eef1f8;border:1px solid #d0d7e8;border-radius:8px;padding:16px;margin:16px 0`),n.innerHTML=`
        <div style="display:flex;gap:12px;align-items:center">
          <span style="font-size:24px;flex-shrink:0;line-height:1">\u{1F4B0}</span>
          <div style="flex:1;min-width:0">
            <p style="font-size:15px;font-weight:600;margin:0 0 4px">Is ${e.currentPrice} a good price for the ${e.name} right now?</p>
            <p style="font-size:13px;color:#6b7280;margin:0 0 12px">It's dropped to ${e.historicalLow} before. We track price history \u2014 we'll tell you if now is a good time to buy, or if you should wait.</p>
            <div style="${W}">
              ${f(t,"si-input")}
              <button data-si="submit" class="si-btn" style="padding:8px 16px;background:#1e2d5a;color:white;border:none;border-radius:6px;font-size:14px;font-weight:500;cursor:pointer;white-space:nowrap;font-family:inherit">${t?"Track this too \u2192":"Check the price history \u2192"}</button>
            </div>
            <p style="font-size:11px;color:#9ca3af;margin:8px 0 0">No spam. No ads. We tell you if it's worth buying now or not.</p>
          </div>
        </div>
      `,n}},deal:{default:(e,t)=>{let n=document.createElement("div");return n.setAttribute("style",`${g};background:#eef1f8;border:1px solid #d0d7e8;border-radius:8px;padding:16px;margin:16px 0`),n.innerHTML=`
        <div style="display:flex;gap:12px;align-items:center">
          <span style="font-size:24px;flex-shrink:0;line-height:1">\u{1F514}</span>
          <div style="flex:1;min-width:0">
            <p style="font-size:15px;font-weight:600;margin:0 0 4px">Is ${e.currentPrice} a good price for the ${e.name} right now?</p>
            <p style="font-size:13px;color:#6b7280;margin:0 0 12px">It's dropped to ${e.historicalLow} before. Alert me when it drops again.</p>
            <div style="${W}">
              ${f(t,"si-input")}
              <button data-si="submit" class="si-btn" style="padding:8px 16px;background:#1e2d5a;color:white;border:none;border-radius:6px;font-size:14px;font-weight:500;cursor:pointer;white-space:nowrap;font-family:inherit">${t?"Track this too \u2192":"Alert me \u2192"}</button>
            </div>
            <p style="font-size:11px;color:#9ca3af;margin:8px 0 0">One email. No spam. We alert you when the price drops.</p>
          </div>
        </div>
      `,n}},research:{default:(e,t)=>{let n=document.createElement("div");return n.setAttribute("style",`${g};background:#faf9f7;border:1px solid #e5e7eb;border-radius:12px;padding:24px;margin:16px 0;max-width:36rem`),n.innerHTML=`
        <p style="font-size:16px;font-weight:700;text-align:center;margin:0 0 4px">See how the ${e.name} scored vs 44 others</p>
        <p style="font-size:13px;color:#6b7280;text-align:center;margin:0 0 16px">Full test scores across every metric \u2014 free, no account needed.</p>
        <div style="display:flex;gap:8px;align-items:center">
          ${f(t,"si-input-light")}
          <button data-si="submit" class="si-btn" style="padding:8px 16px;background:#111827;color:white;border:none;border-radius:6px;font-size:14px;font-weight:500;cursor:pointer;white-space:nowrap;font-family:inherit">${t?"Track this too \u2192":"See full scores \u2192"}</button>
        </div>
      `,n}}},Y={quiz:{default:(e,t)=>{let n=document.createElement("div");return n.setAttribute("style",`${g};background:#faf9f7;border:1px solid #e5e7eb;border-radius:12px;padding:24px;margin:16px 0;max-width:36rem`),n.innerHTML=`
        <p style="font-size:16px;font-weight:700;text-align:center;margin:0 0 4px">Not sure which one to buy?</p>
        <p style="font-size:13px;color:#6b7280;text-align:center;margin:0 0 16px">Take our 2-minute quiz and we'll tell you exactly which one fits your needs.</p>
        <div style="display:flex;gap:8px;align-items:center">
          ${f(t,"si-input-light")}
          <button data-si="submit" class="si-btn" style="padding:8px 16px;background:#111827;color:white;border:none;border-radius:6px;font-size:14px;font-weight:500;cursor:pointer;white-space:nowrap;font-family:inherit">${t?"Track this too \u2192":"Take the quiz \u2192"}</button>
        </div>
      `,n}}};function q(e){return e.type==="product"?e.intent==="buying"||e.intent==="deal"?`${e.productId}:${e.intent}`:`${e.category}:${e.intent}`:`${e.category}:${e.intent}`}function F(e,t){var i,r,o,s,l,d;if(e.type==="product"){let a=j[e.intent];return(o=(r=(i=a==null?void 0:a[e.layout])!=null?i:a==null?void 0:a.default)==null?void 0:r(e,t))!=null?o:null}let n=Y[e.intent];return(d=(l=(s=n==null?void 0:n[e.layout])!=null?s:n==null?void 0:n.default)==null?void 0:l(e,t))!=null?d:null}function J(e){var a;let t=q(e),n=v(),i=F(e,n);if(!i)return document.createElement("div");let r=i.querySelector('[data-si="email"]'),o=i.querySelector('[data-si="submit"]'),s=(a=o.textContent)!=null?a:"",l=e.type==="product"?e.productId:"",d=e.type==="product"?e.currentPrice:void 0;return o.addEventListener("click",async()=>{let p=r.value.trim();if(!p)return;o.disabled=!0,o.textContent="Sending\u2026";let y=await u(p,l,e.category,e.intent,d);y.success?(L(t),i.innerHTML=`<p style="font-family:ui-sans-serif,system-ui,sans-serif;color:#059669;font-weight:500;margin:0">\u2713 You're in. Check your inbox.</p>`):(o.disabled=!1,o.textContent=s,r.setCustomValidity(y.error),r.reportValidity())}),i}async function N(){let e=Array.from(document.querySelectorAll("[data-si-inline]"));if(!e.length)return;let t=await z(),n=new Map(t.map(r=>[r.type==="product"?r.productId:`${r.category}:${r.intent}`,r])),i=new IntersectionObserver(r=>{r.forEach(o=>{var a,p;if(!o.isIntersecting)return;i.unobserve(o.target);let s=o.target,l=(a=s.dataset.siInline)!=null?a:"",d=(p=n.get(l))!=null?p:null;d&&!T(q(d))&&s.replaceWith(J(d))})},{rootMargin:"600px"});e.forEach(r=>i.observe(r))}function D(e,t){var n,i;E(t),(n=e.querySelector('[data-si="blur"]'))==null||n.classList.remove("blur-sm","select-none","pointer-events-none"),(i=e.querySelector('[data-si="overlay"]'))==null||i.remove()}function V(e,t){let n=document.createElement("div");n.dataset.si="overlay",n.className="absolute inset-0 flex items-center justify-center bg-white/70 rounded-lg",n.innerHTML=`
    <div class="bg-white border border-gray-200 rounded-lg p-6 max-w-sm text-center shadow-lg">
      <p class="font-semibold m-0 mb-2">See the full scoreboard</p>
      <p class="text-gray-500 m-0 mb-4 text-[13px]">Free. No credit card.</p>
      <div class="flex flex-col gap-2">
        <input data-si="email" class="px-3 py-2 border border-gray-300 rounded-md text-sm outline-none focus:border-gray-900" type="email" placeholder="Your email" />
        <button data-si="submit" class="px-4 py-2 bg-gray-900 text-white border-none rounded-md text-sm font-medium cursor-pointer hover:bg-gray-700">Unlock scores \u2192</button>
      </div>
    </div>
  `;let i=n.querySelector('[data-si="email"]'),r=n.querySelector('[data-si="submit"]');return r.addEventListener("click",async()=>{let o=i.value.trim();if(!o)return;r.disabled=!0,r.textContent="Unlocking\u2026",(await u(o)).success?D(e,t):(r.disabled=!1,r.textContent="Unlock scores \u2192")}),n}function K(e){var i;let t=(i=e.dataset.siGate)!=null?i:"default";if(m()||k(t))return;e.classList.add("relative");let n=e.firstElementChild;n&&(n.dataset.si="blur",n.classList.add("blur-sm","select-none","pointer-events-none")),e.appendChild(V(e,t))}function O(){document.querySelectorAll("[data-si-gate]").forEach(K)}function Q(e){let t=document.createElement("div");t.dataset.si="exit-overlay",t.className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]",t.innerHTML=`
    <div data-si="exit-modal" class="relative bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
      <button data-si="exit-close" aria-label="Close" class="absolute top-3 right-4 text-gray-400 text-xl leading-none cursor-pointer border-none bg-transparent hover:text-gray-600">\xD7</button>
      <p class="text-[18px] font-semibold m-0 mb-2">Before you go \u2014</p>
      <p class="text-gray-700 m-0 mb-5">Get our verdict on this product, plus price history, delivered to your inbox. Free.</p>
      <div class="flex flex-col gap-2">
        <input data-si="email" class="px-3 py-2 border border-gray-300 rounded-md text-sm outline-none focus:border-gray-900" type="email" placeholder="Your email" />
        <button data-si="submit" class="px-4 py-2 bg-gray-900 text-white border-none rounded-md text-sm font-medium cursor-pointer hover:bg-gray-700">Send me the results \u2192</button>
      </div>
      <p class="text-[12px] text-gray-400 m-0 mt-3">We buy everything we test. No ads.</p>
    </div>
  `;let n=t.querySelector('[data-si="email"]'),i=t.querySelector('[data-si="submit"]'),r=t.querySelector('[data-si="exit-close"]'),o=t.querySelector('[data-si="exit-modal"]'),s=()=>{t.remove(),e()};return r.addEventListener("click",s),t.addEventListener("click",l=>{l.target===t&&s()}),i.addEventListener("click",async()=>{let l=n.value.trim();if(!l)return;i.disabled=!0,i.textContent="Sending\u2026",(await u(l)).success?(o.innerHTML=`<p class="text-[18px] font-semibold m-0 mb-2">\u2713 Check your inbox</p><p class="text-gray-500 m-0">We'll send the results shortly.</p>`,setTimeout(s,2e3)):(i.disabled=!1,i.textContent="Send me the results \u2192")}),t}function U(){m()||b()||(I(),document.body.appendChild(Q(()=>{})))}function X(){document.addEventListener("mouseleave",e=>{e.clientY<=0&&U()},{once:!0})}function Z(){window.addEventListener("popstate",U,{once:!0})}function _(){if(m()||b())return;/Mobi|Android/i.test(navigator.userAgent)?Z():X()}function ee(){document.querySelectorAll('[data-si-track="affiliate"]').forEach(e=>{e.addEventListener("click",()=>{var n;let t=(n=e.dataset.siProduct)!=null?n:"";t&&P(t)})})}function R(){h(),N(),O(),_(),ee()}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",R):R();})();
