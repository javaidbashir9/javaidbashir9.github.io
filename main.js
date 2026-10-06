/**
 * JAVAID BASHIR — COMPLETE NOCTURNAL ALPINE 3D PORTFOLIO
 * Interactive Controller:
 *  - High-Density 3D Falling Snowflakes Engine (Fixed full-page canvas)
 *  - Apple Sliding Frosted Glass Navbar with ScrollSpy
 *  - Hero Mountain Parallax & Spatial Tilt
 *  - Entrance choreography & mobile drawer
 */

document.addEventListener('DOMContentLoaded', () => {
  initHeroEntrance();
  initHighDensitySnow();
  initSnowToggle();
  initNavGlassSliderWithScrollSpy();
  initSpatialTilt();
  initMobileNav();
  initGlassHoverLight();
  initGlassTileCrack();
  initHeadlineTypewriter();
  initMoreInfoModal();
  initCertGalleryModal();
  initSkillsProjectsModal();
  initAboutGalleryModal();
  initImageLightbox();
  initHeroKineticHeadline();
  initHeroNameInteractive();
  initDomainTagsDancing();
});

/* ==========================================================================
   1. ENTRANCE CHOREOGRAPHY
   ========================================================================= */
function initHeroEntrance() {
  const hero = document.getElementById('home');
  const navbar = document.getElementById('navbar');

  requestAnimationFrame(() => {
    setTimeout(() => {
      navbar?.classList.add('is-loaded');
    }, 150);

    setTimeout(() => {
      hero?.classList.add('is-active');
    }, 280);
  });
}

/* ==========================================================================
   2. HIGH-DENSITY 3D FALLING SNOWFLAKES ENGINE (SMOOTH & VISIBLE OPPOSING WIND)
   - Cursor movement away from center pushes snowflakes to the OPPOSITE side
   - Speed at edges is smoothly tuned so every individual snowflake remains visible
   ========================================================================== */
function initHighDensitySnow() {
  const canvas = document.getElementById('snow-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width = 0;
  let height = 0;
  let flakes = [];
  const FLAKE_COUNT = 190;

  function resize() {
    width = canvas.width = window.innerWidth || document.documentElement.clientWidth || 1280;
    height = canvas.height = window.innerHeight || document.documentElement.clientHeight || 800;
  }
  window.addEventListener('resize', resize);
  resize();

  // Multi-method snow controller: Show snowfall on all sections/pages EXCEPT Home cover
  function setSnowState(isActive) {
    if (!window.__isSnowGloballyEnabled) {
      canvas.classList.remove('snow-active');
      canvas.style.opacity = '0';
      canvas.style.visibility = 'hidden';
      return;
    }
    if (isActive) {
      canvas.classList.add('snow-active');
      canvas.style.opacity = '1';
      canvas.style.visibility = 'visible';
    } else {
      canvas.classList.remove('snow-active');
      canvas.style.opacity = '0';
      canvas.style.visibility = 'hidden';
    }
  }

  window.__setSnowState = setSnowState;

  function updateSnowVisibility() {
    if (!window.__isSnowGloballyEnabled) {
      setSnowState(false);
      return;
    }

    const scrollPos = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    const currentHash = window.location.hash;

    // Direct hash check: any anchor other than home activates snow immediately
    if (currentHash && currentHash !== '#home' && currentHash !== '') {
      setSnowState(true);
      return;
    }

    const hero = document.getElementById('home');
    if (hero) {
      const rect = hero.getBoundingClientRect();
      // If hero has scrolled up or is leaving the top of the viewport
      if (rect.bottom < window.innerHeight * 0.75 || scrollPos > 80) {
        setSnowState(true);
      } else {
        setSnowState(false);
      }
    } else {
      setSnowState(scrollPos > 80);
    }
  }

  window.__updateSnowVisibility = updateSnowVisibility;

  window.addEventListener('scroll', updateSnowVisibility, { passive: true });
  document.addEventListener('scroll', updateSnowVisibility, { passive: true });
  window.addEventListener('hashchange', updateSnowVisibility);

  // IntersectionObserver for high reliability
  if ('IntersectionObserver' in window) {
    const hero = document.getElementById('home');
    if (hero) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting || entry.intersectionRatio < 0.25) {
            setSnowState(true);
          } else {
            const scrollPos = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
            if (scrollPos < 80) {
              setSnowState(false);
            }
          }
        });
      }, { threshold: [0, 0.2, 0.5, 0.8, 1.0] });
      observer.observe(hero);
    }
  }

  // Bind to all navigation links (desktop navbar, mobile drawer, hero buttons, footer links)
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', () => {
      const href = link.getAttribute('href');
      if (href === '#home') {
        setTimeout(() => setSnowState(false), 80);
      } else {
        setSnowState(true);
      }
    });
  });

  // Initial check
  updateSnowVisibility();

  // Physics wind trackers
  let currentWindX = 0;
  let targetWindX = 0;
  let currentWindY = 0;
  let targetWindY = 0;
  let edgeSpeedBoost = 1.0;
  let targetEdgeBoost = 1.0;

  let lastMouseX = width / 2;

  window.addEventListener('mousemove', (e) => {
    const centerX = width / 2;
    const centerY = height / 2;

    // Normalized distance from center (-1 to +1)
    const normX = (e.clientX - centerX) / (centerX || 1);
    const normY = (e.clientY - centerY) / (centerY || 1);

    const deltaX = e.clientX - lastMouseX;
    lastMouseX = e.clientX;

    const absNormX = Math.abs(normX);
    const absNormY = Math.abs(normY);
    const radialDist = Math.hypot(normX, normY);

    // OPPOSITE DIRECTION: Cursor Right -> Wind Left; Cursor Left -> Wind Right
    const oppSignX = -Math.sign(normX);
    const oppSignY = -Math.sign(normY);

    // GENTLE, VISIBLY PERCEPTIBLE WIND AT EDGES (Max ~3.8px so flakes are always clearly visible)
    const edgePow = Math.pow(absNormX, 1.8);
    const edgeWindSpeed = edgePow * 3.6;
    const baseWind = absNormX * 1.2;
    const velocityImpulse = -deltaX * 0.08;

    targetWindX = oppSignX * (baseWind + edgeWindSpeed) + velocityImpulse;
    targetWindY = oppSignY * (Math.pow(absNormY, 1.6) * 1.4);

    // Smooth edge multiplier: gently faster, never rushing or blurring out
    targetEdgeBoost = 1.0 + Math.pow(Math.min(radialDist, 1.2), 1.6) * 0.45;
  }, { passive: true });

  class Snowflake {
    constructor() {
      this.reset(true);
    }

    reset(initial = false) {
      this.x = Math.random() * (width + 160) - 80;
      this.y = initial ? Math.random() * height : -30;
      
      this.z = Math.random();
      this.radius = 1.2 + this.z * 3.2;
      this.baseSpeedY = 0.55 + this.z * 1.4;
      this.baseSpeedX = (Math.random() - 0.5) * 0.35;
      
      this.wobble = Math.random() * Math.PI * 2;
      this.wobbleSpeed = 0.016 + Math.random() * 0.02;
      this.wobbleAmplitude = 0.4 + this.z * 0.6;
      
      this.alpha = 0.55 + this.z * 0.45;

      this.vx = 0;
      this.vy = this.baseSpeedY;
    }

    update() {
      this.wobble += this.wobbleSpeed;

      const depthFactor = 0.6 + this.z * 0.8;
      this.vx = (Math.sin(this.wobble) * this.wobbleAmplitude + this.baseSpeedX + currentWindX * depthFactor) * edgeSpeedBoost;
      this.vy = (this.baseSpeedY + currentWindY * depthFactor * 0.4) * edgeSpeedBoost;

      this.x += this.vx;
      this.y += Math.max(0.3, this.vy);

      if (this.y > height + 30) {
        this.reset();
      } else if (this.y < -35) {
        this.y = height + 10;
      }

      if (this.x < -70) {
        this.x = width + 50;
        this.y = Math.random() * height;
      } else if (this.x > width + 70) {
        this.x = -50;
        this.y = Math.random() * height;
      }
    }

    draw(ctx) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);

      // Luminous crystal white glow - pure monochrome
      if (this.z > 0.5) {
        ctx.shadowColor = 'rgba(255, 255, 255, 0.95)';
        ctx.shadowBlur = 6 + this.z * 4;
      } else {
        ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
        ctx.shadowBlur = 3;
      }

      ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha})`;
      ctx.fill();
      ctx.restore();
    }
  }

  for (let i = 0; i < FLAKE_COUNT; i++) {
    flakes.push(new Snowflake());
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);

    currentWindX += (targetWindX - currentWindX) * 0.06;
    currentWindY += (targetWindY - currentWindY) * 0.06;
    edgeSpeedBoost += (targetEdgeBoost - edgeSpeedBoost) * 0.06;

    for (let f of flakes) {
      f.update();
      f.draw(ctx);
    }
    requestAnimationFrame(animate);
  }

  animate();
}

/* ==========================================================================
   2B. SNOWFALL ON/OFF TOGGLE CONTROLLER
   - Enables users to turn snow flow ON or OFF with dynamic state preservation
   - Synchronizes toggle button text, icon, and canvas display
   ========================================================================== */
function initSnowToggle() {
  const toggleBtn = document.getElementById('snow-toggle-btn');
  if (!toggleBtn) return;

  const label = toggleBtn.querySelector('.snow-toggle-text');

  function updateButtonUI() {
    if (window.__isSnowGloballyEnabled) {
      toggleBtn.classList.remove('is-disabled');
      toggleBtn.setAttribute('aria-pressed', 'true');
      if (label) label.textContent = 'ON';
      toggleBtn.title = 'Snowfall Animation is ON (Click to turn OFF)';
    } else {
      toggleBtn.classList.add('is-disabled');
      toggleBtn.setAttribute('aria-pressed', 'false');
      if (label) label.textContent = 'OFF';
      toggleBtn.title = 'Snowfall Animation is OFF (Click to turn ON)';
    }
  }

  // Initial UI sync
  updateButtonUI();

  toggleBtn.addEventListener('click', (e) => {
    e.preventDefault();
    window.__isSnowGloballyEnabled = !window.__isSnowGloballyEnabled;
    try {
      localStorage.setItem('jb_snow_enabled', window.__isSnowGloballyEnabled ? 'true' : 'false');
    } catch (err) {}
    
    updateButtonUI();

    if (window.__isSnowGloballyEnabled) {
      if (window.__updateSnowVisibility) {
        window.__updateSnowVisibility();
      } else if (window.__setSnowState) {
        window.__setSnowState(true);
      }
    } else {
      if (window.__setSnowState) {
        window.__setSnowState(false);
      }
    }
  });
}

/* ==========================================================================
   3. APPLE SLIDING FROSTED GLASS NAVBAR & SCROLLSPY
   ========================================================================== */
function initNavGlassSliderWithScrollSpy() {
  const container = document.getElementById('nav-container');
  const slider = document.getElementById('nav-slider');
  // Target only top-level navigation items
  const navLinks = document.querySelectorAll('#nav-links > li > .nav-link');
  const dropdownItems = document.querySelectorAll('.nav-item-dropdown');
  const dropdownLinks = document.querySelectorAll('.dropdown-link');
  const sections = document.querySelectorAll('section[id]');
  
  if (!container || !slider || navLinks.length === 0) return;

  let currentActiveLink = navLinks[0];

  function moveToLink(link, isVisible = true) {
    if (!link) return;
    const containerRect = container.getBoundingClientRect();
    const linkRect = link.getBoundingClientRect();

    const left = linkRect.left - containerRect.left;
    const width = linkRect.width;

    slider.style.transform = `translateX(${left}px)`;
    slider.style.width = `${width}px`;

    if (isVisible) {
      slider.classList.add('active');
    } else {
      slider.classList.remove('active');
    }
  }

  // Initial position
  moveToLink(currentActiveLink, true);

  // Mouse hover events on top-level links
  navLinks.forEach((link) => {
    link.addEventListener('mouseenter', () => {
      moveToLink(link, true);
    });
  });

  // Keep slider on parent link when hovering inside dropdown submenus
  dropdownItems.forEach((item) => {
    const parentLink = item.querySelector(':scope > .nav-link');
    if (!parentLink) return;

    item.addEventListener('mouseenter', () => {
      moveToLink(parentLink, true);
    });
  });

  // Handle dropdown subpage clicks: sync active pill to parent category
  dropdownLinks.forEach((dropLink) => {
    dropLink.addEventListener('click', () => {
      const parentItem = dropLink.closest('.nav-item-dropdown');
      if (parentItem) {
        const parentLink = parentItem.querySelector(':scope > .nav-link');
        if (parentLink) {
          navLinks.forEach(l => l.classList.remove('active'));
          parentLink.classList.add('active');
          currentActiveLink = parentLink;
          moveToLink(currentActiveLink, true);
        }
      }
    });
  });

  container.addEventListener('mouseleave', () => {
    moveToLink(currentActiveLink, true);
  });

  window.addEventListener('resize', () => {
    moveToLink(currentActiveLink, true);
  });

  // ScrollSpy: auto-detect current section in view with hierarchical mapping
  let scrollTimeout;
  window.addEventListener('scroll', () => {
    if (scrollTimeout) return;
    scrollTimeout = setTimeout(() => {
      scrollTimeout = null;

      const scrollPos = window.scrollY + 200;
      let activeSectionId = 'home';

      sections.forEach((sec) => {
        const top = sec.offsetTop;
        const height = sec.offsetHeight;
        if (scrollPos >= top && scrollPos < top + height) {
          activeSectionId = sec.getAttribute('id');
        }
      });

      // Hierarchical mapping:
      // - 'skills' maps to parent link 'about'
      // - 'projects' maps to parent link 'experience'
      let mappedTargetId = activeSectionId;
      if (activeSectionId === 'skills') {
        mappedTargetId = 'about';
      } else if (activeSectionId === 'projects') {
        mappedTargetId = 'experience';
      }

      navLinks.forEach((link) => {
        const targetId = link.getAttribute('href').replace('#', '');
        if (targetId === mappedTargetId) {
          link.classList.add('active');
          currentActiveLink = link;
          moveToLink(currentActiveLink, true);
        } else {
          link.classList.remove('active');
        }
      });
    }, 40);
  }, { passive: true });
}

/* ==========================================================================
   4. RESTRAINED 3D SPATIAL TILT
   ========================================================================== */
function initSpatialTilt() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  const heroContent = document.getElementById('hero-content');
  if (!heroContent) return;

  let targetRotateX = 0;
  let targetRotateY = 0;
  let currentRotateX = 0;
  let currentRotateY = 0;

  window.addEventListener('mousemove', (e) => {
    const { innerWidth, innerHeight } = window;
    const x = (e.clientX / innerWidth - 0.5) * 2;
    const y = (e.clientY / innerHeight - 0.5) * 2;

    targetRotateY = x * 1.5;
    targetRotateX = -y * 1.5;
  }, { passive: true });

  function lerp(start, end, factor) {
    return start + (end - start) * factor;
  }

  function updateTilt() {
    currentRotateX = lerp(currentRotateX, targetRotateX, 0.08);
    currentRotateY = lerp(currentRotateY, targetRotateY, 0.08);

    heroContent.style.transform = `perspective(1000px) rotateX(${currentRotateX.toFixed(2)}deg) rotateY(${currentRotateY.toFixed(2)}deg)`;
    requestAnimationFrame(updateTilt);
  }

  updateTilt();
}

/* ==========================================================================
   5. MOBILE NAVIGATION TOGGLE
   ========================================================================== */
function initMobileNav() {
  const toggle = document.getElementById('mobile-toggle');
  const drawer = document.getElementById('mobile-drawer');
  const links = document.querySelectorAll('.mobile-link');

  if (!toggle || !drawer) return;

  toggle.addEventListener('click', () => {
    const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', !isExpanded);
    toggle.classList.toggle('active');
    drawer.classList.toggle('open');
    drawer.setAttribute('aria-hidden', isExpanded);
  });

  links.forEach(link => {
    link.addEventListener('click', () => {
      toggle.setAttribute('aria-expanded', 'false');
      toggle.classList.remove('active');
      drawer.classList.remove('open');
      drawer.setAttribute('aria-hidden', 'true');
    });
  });
}

/* ==========================================================================
   6. HOVER GLASS LIGHT ANIMATION & EDGE ILLUMINATION
   Tracks cursor across all glass tiles, buttons, and segment badges to cast specular edge refraction
   ========================================================================== */
function initGlassHoverLight() {
  const interactiveGlassElements = document.querySelectorAll('.glass-card, .glass-btn, .section-badge, .modal-badge, .status-pill');

  interactiveGlassElements.forEach((el) => {
    function updatePos(e) {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      el.style.setProperty('--mouse-x', `${x}px`);
      el.style.setProperty('--mouse-y', `${y}px`);
      el.style.setProperty('--water-x', `${x}px`);
      el.style.setProperty('--water-y', `${y}px`);
    }

    el.addEventListener('mousemove', updatePos, { passive: true });
    el.addEventListener('mouseenter', updatePos, { passive: true });
  });
}

/* ==========================================================================
   7. INTERACTIVE GLASS CRACK SHATTER ON CLICK
   Dynamically generates authentic spiderweb fracture rays, epicenter star, and concentric shattered rings
   ========================================================================== */
function initGlassTileCrack() {
  const glassCards = document.querySelectorAll('.glass-card');

  glassCards.forEach((card) => {
    card.addEventListener('click', (e) => {
      // Do not crack if clicking directly on a link, button, or form control
      if (e.target.closest('a, button, input, textarea, label')) return;

      const rect = card.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      createGlassCrack(card, clickX, clickY, rect.width, rect.height);
    });
  });
}

function createGlassCrack(card, originX, originY, width, height) {
  // Trigger tactile card micro-shake
  card.classList.remove('glass-impact');
  void card.offsetWidth; // force reflow
  card.classList.add('glass-impact');
  setTimeout(() => card.classList.remove('glass-impact'), 400);

  // SVG Fracture System
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'glass-crack-svg');
  svg.setAttribute('viewBox', `0 0 ${Math.round(width)} ${Math.round(height)}`);
  svg.setAttribute('aria-hidden', 'true');

  // 1. Epicenter Impact Core
  const epicenter = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
  const epiPoints = [];
  const epiSpokes = 8 + Math.floor(Math.random() * 4);
  for (let i = 0; i < epiSpokes; i++) {
    const angle = (i / epiSpokes) * Math.PI * 2;
    const rad = (i % 2 === 0 ? 8 : 3.5) + Math.random() * 3;
    epiPoints.push(`${(originX + Math.cos(angle) * rad).toFixed(1)},${(originY + Math.sin(angle) * rad).toFixed(1)}`);
  }
  epicenter.setAttribute('points', epiPoints.join(' '));
  epicenter.setAttribute('class', 'crack-epicenter');
  svg.appendChild(epicenter);

  // 2. Radial Fracture Rays
  const rayCount = 8 + Math.floor(Math.random() * 5); // 8 to 12 main fracture rays
  const rayPoints = [];

  for (let i = 0; i < rayCount; i++) {
    const baseAngle = (i / rayCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.35;
    const maxLen = Math.min(width, height) * (0.35 + Math.random() * 0.5);
    const segments = 4 + Math.floor(Math.random() * 3);

    let currX = originX;
    let currY = originY;
    const points = [{ x: currX, y: currY }];
    let dStr = `M ${originX.toFixed(1)} ${originY.toFixed(1)}`;

    for (let s = 1; s <= segments; s++) {
      const segProgress = s / segments;
      const segLen = maxLen * segProgress;
      const jitterAngle = baseAngle + (Math.random() - 0.5) * 0.25;
      currX = originX + Math.cos(jitterAngle) * segLen;
      currY = originY + Math.sin(jitterAngle) * segLen;
      dStr += ` L ${currX.toFixed(1)} ${currY.toFixed(1)}`;
      points.push({ x: currX, y: currY });
    }

    rayPoints.push(points);

    const rayPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    rayPath.setAttribute('d', dStr);
    rayPath.setAttribute('class', 'crack-ray');
    const pathLen = maxLen * 1.25;
    rayPath.style.setProperty('--path-length', `${pathLen}px`);
    rayPath.style.strokeDasharray = `${pathLen}`;
    rayPath.style.strokeDashoffset = `${pathLen}`;
    svg.appendChild(rayPath);

    // Micro splinter branch off ray
    if (Math.random() > 0.25 && points.length > 2) {
      const branchIdx = Math.floor(points.length * (0.3 + Math.random() * 0.4));
      const bOrigin = points[branchIdx];
      const bAngle = baseAngle + (Math.random() > 0.5 ? 0.65 : -0.65);
      const bLen = maxLen * (0.2 + Math.random() * 0.25);
      const bTargetX = bOrigin.x + Math.cos(bAngle) * bLen;
      const bTargetY = bOrigin.y + Math.sin(bAngle) * bLen;

      const branchPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      branchPath.setAttribute('d', `M ${bOrigin.x.toFixed(1)} ${bOrigin.y.toFixed(1)} L ${(bOrigin.x + (bTargetX - bOrigin.x) * 0.5 + (Math.random() - 0.5) * 8).toFixed(1)} ${(bOrigin.y + (bTargetY - bOrigin.y) * 0.5 + (Math.random() - 0.5) * 8).toFixed(1)} L ${bTargetX.toFixed(1)} ${bTargetY.toFixed(1)}`);
      branchPath.setAttribute('class', 'crack-sub-ray');
      branchPath.style.setProperty('--path-length', `${bLen}px`);
      branchPath.style.strokeDasharray = `${bLen}`;
      branchPath.style.strokeDashoffset = `${bLen}`;
      svg.appendChild(branchPath);
    }
  }

  // 3. Concentric Spiderweb Rings connecting adjacent rays
  const ringCount = 2 + (Math.random() > 0.5 ? 1 : 0);
  for (let r = 0; r < ringCount; r++) {
    const ringFrac = 0.22 + r * 0.28;
    let ringD = '';
    let startPoint = null;

    for (let i = 0; i < rayPoints.length; i++) {
      const pts = rayPoints[i];
      const idx = Math.min(Math.floor(pts.length * ringFrac), pts.length - 1);
      const pt = pts[idx];
      const jX = pt.x + (Math.random() - 0.5) * 6;
      const jY = pt.y + (Math.random() - 0.5) * 6;

      if (i === 0) {
        ringD = `M ${jX.toFixed(1)} ${jY.toFixed(1)}`;
        startPoint = { x: jX, y: jY };
      } else {
        ringD += ` L ${jX.toFixed(1)} ${jY.toFixed(1)}`;
      }
    }
    if (startPoint && Math.random() > 0.3) {
      ringD += ` L ${startPoint.x.toFixed(1)} ${startPoint.y.toFixed(1)}`;
    }

    const ringPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    ringPath.setAttribute('d', ringD);
    ringPath.setAttribute('class', 'crack-ring');
    const rLen = 450;
    ringPath.style.setProperty('--path-length', `${rLen}px`);
    ringPath.style.strokeDasharray = `${rLen}`;
    ringPath.style.strokeDashoffset = `${rLen}`;
    svg.appendChild(ringPath);
  }

  card.appendChild(svg);

  // Self-healing / melting transition after 2.4 seconds
  setTimeout(() => {
    svg.classList.add('melting');
  }, 2400);

  setTimeout(() => {
    svg.remove();
  }, 3200);
}

/* ==========================================================================
   8. HEADLINE TYPEWRITER CONTROLLER (CLEAN FORWARD TYPING — NO BACKSPACE)
   - Every segment headline and animation text is colored Cobalt Blue rgb(0, 34, 255)
   - Pure forward typing animation with natural human rhythm
   - NEVER backspaces or erases: permanently holds completed headline
   ========================================================================== */
function initHeadlineTypewriter() {

  // Typewriter Controller Class for individual section headlines:
  // 1. Each headline shows ONLY its own distinct text.
  // 2. Headlines and animation text are styled in Cobalt Blue rgb(0, 34, 255).
  // 3. Types letter-by-letter with a comfortable, natural human speed.
  // 4. Smoothly moves forward from word to word with ZERO backspace.
  // 5. Permanently holds the completed headline once finished.
  class HeadlineTypewriter {
    constructor(element) {
      this.el = element;
      this.typedSpan = element.querySelector('.typed-text') || element;

      // Extract only its own distinct headline text
      const customHeadline = element.getAttribute('data-headline');
      if (customHeadline) {
        this.fullText = customHeadline.trim();
      } else {
        let rawPhrases = element.getAttribute('data-phrases');
        if (rawPhrases) {
          try {
            const parsed = JSON.parse(rawPhrases);
            this.fullText = Array.isArray(parsed) && parsed.length > 0 ? parsed[0].trim() : element.textContent.trim();
          } catch (e) {
            this.fullText = element.textContent.trim();
          }
        } else {
          this.fullText = element.textContent.trim();
        }
      }

      // Split into word tokens
      this.words = this.fullText.split(/\s+/).filter(Boolean);
      this.wordIndex = 0;
      this.completedWords = [];
      this.currentWordChars = '';
      this.isInView = false;
      this.hasStarted = false;
      this.isErasing = false;
      this.timer = null;

      // Render full static headline on initial load to preserve layout & SEO
      this.renderFullStatic();

      // Click to replay animation anytime
      this.el.style.cursor = 'pointer';
      this.el.setAttribute('title', 'Click to replay typing animation');
      this.el.addEventListener('click', () => {
        this.restart();
      });
    }

    escapeHtml(str) {
      return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    // Helper to wrap the first alphabetic character of ANY word in .headline-initial-char (Cobalt Blue rgb(0, 34, 255))
    formatWordWithInitialChar(wordStr) {
      if (!wordStr) return '';
      const match = wordStr.match(/^([^A-Za-z]*)([A-Za-z])(.*)$/);
      if (match) {
        const prefix = this.escapeHtml(match[1]);
        const initial = this.escapeHtml(match[2]);
        const rest = this.escapeHtml(match[3]);
        return `${prefix}<span class="headline-initial-char">${initial}</span>${rest}`;
      }
      return this.escapeHtml(wordStr);
    }

    renderFullStatic() {
      let html = '';
      for (let i = 0; i < this.words.length; i++) {
        html += `<span class="word-token">${this.formatWordWithInitialChar(this.words[i])}</span>` + (i < this.words.length - 1 ? ' ' : '');
      }
      this.typedSpan.innerHTML = html;
    }

    render() {
      let html = '';

      // 1. Render all completed words with first letter blue
      for (let i = 0; i < this.completedWords.length; i++) {
        const hasNext = (i < this.completedWords.length - 1) || (this.currentWordChars.length > 0);
        html += `<span class="word-token">${this.formatWordWithInitialChar(this.completedWords[i])}</span>` + (hasNext ? ' ' : '');
      }

      // 2. Render current active word with first letter blue
      if (this.currentWordChars.length > 0) {
        html += `<span class="word-token">${this.formatWordWithInitialChar(this.currentWordChars)}</span>`;
      }

      this.typedSpan.innerHTML = html;
    }

    startTypingCycle() {
      if (this.timer) clearTimeout(this.timer);
      this.wordIndex = 0;
      this.completedWords = [];
      this.currentWordChars = '';
      this.render();
      this.timer = setTimeout(() => {
        this.step();
      }, 250);
    }

    step() {
      const targetWord = this.words[this.wordIndex];
      if (!targetWord) {
        this.handleHeadlineComplete();
        return;
      }

      // Type next character of the current word
      if (this.currentWordChars.length < targetWord.length) {
        const nextChar = targetWord.charAt(this.currentWordChars.length);
        this.currentWordChars += nextChar;
        this.render();

        // Check if the current word has reached completion
        if (this.currentWordChars.length === targetWord.length) {
          // Word reached completion: Move directly to next word (NO BACKSPACE!)
          this.completedWords.push(this.currentWordChars);
          this.currentWordChars = '';
          this.wordIndex++;

          if (this.wordIndex < this.words.length) {
            // Natural pause between words (~140ms)
            this.timer = setTimeout(() => {
              this.step();
            }, 140);
          } else {
            // All words complete: finalize headline (NO BACKSPACE!)
            this.handleHeadlineComplete();
          }
        } else {
          // Continue typing next letter (deliberate human speed: 50ms - 85ms)
          const typingSpeed = Math.floor(Math.random() * 35) + 50;
          this.timer = setTimeout(() => {
            this.step();
          }, typingSpeed);
        }
      }
    }

    handleHeadlineComplete() {
      // Headline is complete: NEVER backspace or erase! Stays permanently visible.
      if (this.timer) clearTimeout(this.timer);
      this.timer = null;
    }

    restart() {
      if (this.timer) clearTimeout(this.timer);
      this.startTypingCycle();
    }
  }

  // Initialize Headline Typewriters on all headlines
  const headlineElements = document.querySelectorAll('.headline-typewriter-target');
  const instances = [];

  headlineElements.forEach(el => {
    const inst = new HeadlineTypewriter(el);
    instances.push(inst);
  });

  // Track which headline is currently in viewport
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const inst = instances.find(i => i.el === entry.target);
        if (inst) {
          inst.isInView = entry.isIntersecting;
          if (entry.isIntersecting) {
            if (!inst.hasStarted) {
              inst.hasStarted = true;
              // Headline first displays full text; typing & backspace animation begins after 2 seconds
              setTimeout(() => {
                inst.startTypingCycle();
              }, 2000);
            }
          }
        }
      });
    }, { threshold: 0.25 });

    headlineElements.forEach(el => observer.observe(el));
  } else {
    instances.forEach((inst, idx) => {
      inst.isInView = true;
      setTimeout(() => inst.startTypingCycle(), 2000 + idx * 800);
    });
  }
}

/* ==========================================================================
   9. PROFESSIONAL PROFILE OVERVIEW POPUP MODAL ("MORE" BUTTON)
   - Opens VisionOS nocturnal frosted glass popup on clicking #open-more-btn
   - Closes on clicking close icon, dismiss button, backdrop click, or ESC key
   - Handles accessibility (aria-hidden) and background scroll locking
   ========================================================================== */
function initMoreInfoModal() {
  const modal = document.getElementById('more-info-modal');
  const openBtn = document.getElementById('open-more-btn') || document.getElementById('hero-more-btn');
  const closeBtn = document.getElementById('close-more-btn');
  const okBtn = document.getElementById('modal-ok-btn');

  if (!modal || !openBtn) return;

  function openModal() {
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (closeBtn) {
      setTimeout(() => closeBtn.focus(), 50);
    }
  }

  function closeModal() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (openBtn) {
      openBtn.focus();
    }
  }

  openBtn.addEventListener('click', (e) => {
    e.preventDefault();
    openModal();
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      closeModal();
    });
  }

  if (okBtn) {
    okBtn.addEventListener('click', (e) => {
      e.preventDefault();
      closeModal();
    });
  }

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) {
      closeModal();
    }
  });
}

/**
 * 9B. CERTIFICATIONS GALLERY POPUP MODAL
 */
function initCertGalleryModal() {
  const modal = document.getElementById('cert-gallery-modal');
  const openBtn = document.getElementById('open-cert-gallery-btn');
  const closeBtn = document.getElementById('close-cert-modal-btn');
  const okBtn = document.getElementById('cert-modal-close-btn');

  if (!modal || !openBtn) return;

  function openModal() {
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (closeBtn) setTimeout(() => closeBtn.focus(), 50);
  }

  function closeModal() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (openBtn) openBtn.focus();
  }

  openBtn.addEventListener('click', (e) => {
    e.preventDefault();
    openModal();
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      closeModal();
    });
  }

  if (okBtn) {
    okBtn.addEventListener('click', (e) => {
      e.preventDefault();
      closeModal();
    });
  }

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) {
      closeModal();
    }
  });
}

/**
 * 9C. SKILLS / MY PROJECTS POPUP MODAL
 */
function initSkillsProjectsModal() {
  const modal = document.getElementById('skills-projects-modal');
  const openBtn = document.getElementById('open-skills-projects-btn');
  const closeBtn = document.getElementById('close-proj-modal-btn');
  const okBtn = document.getElementById('proj-modal-close-btn');

  if (!modal || !openBtn) return;

  function openModal() {
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (closeBtn) setTimeout(() => closeBtn.focus(), 50);
  }

  function closeModal() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (openBtn) openBtn.focus();
  }

  openBtn.addEventListener('click', (e) => {
    e.preventDefault();
    openModal();
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      closeModal();
    });
  }

  if (okBtn) {
    okBtn.addEventListener('click', (e) => {
      e.preventDefault();
      closeModal();
    });
  }

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) {
      closeModal();
    }
  });
}

/**
 * 9D. ABOUT SECTION PHOTO GALLERY & CUSTOM UPLOAD POPUP MODAL
 * - Allows Javaid Bashir to view photos and upload new pictures with live preview
 * - Auto-binds new pictures to the fullscreen inspection lightbox
 */
function initAboutGalleryModal() {
  const modal = document.getElementById('about-photos-modal');
  const openBtn = document.getElementById('open-about-gallery-btn');
  const closeBtn = document.getElementById('close-about-gallery-btn');
  const okBtn = document.getElementById('about-gallery-close-btn');
  const uploadInput = document.getElementById('user-photo-input');
  const dropzone = document.getElementById('upload-dropzone');
  const triggerBtn = document.getElementById('trigger-upload-btn');
  const photosGrid = document.getElementById('about-photos-grid');

  if (!modal || !openBtn) return;

  function openModal() {
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (closeBtn) setTimeout(() => closeBtn.focus(), 50);
  }

  function closeModal() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (openBtn) openBtn.focus();
  }

  openBtn.addEventListener('click', (e) => {
    e.preventDefault();
    openModal();
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      closeModal();
    });
  }

  if (okBtn) {
    okBtn.addEventListener('click', (e) => {
      e.preventDefault();
      closeModal();
    });
  }

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) {
      closeModal();
    }
  });

  // Photo Upload Handler (Browse & Drag/Drop)
  if (triggerBtn && uploadInput) {
    triggerBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      uploadInput.click();
    });
  }

  if (dropzone && uploadInput) {
    dropzone.addEventListener('click', (e) => {
      if (e.target !== triggerBtn) {
        uploadInput.click();
      }
    });

    ['dragenter', 'dragover'].forEach(name => {
      dropzone.addEventListener(name, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(name => {
      dropzone.addEventListener(name, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('dragover');
      });
    });

    dropzone.addEventListener('drop', (e) => {
      if (e.dataTransfer && e.dataTransfer.files) {
        handleUploadedFiles(e.dataTransfer.files);
      }
    });

    uploadInput.addEventListener('change', () => {
      if (uploadInput.files) {
        handleUploadedFiles(uploadInput.files);
      }
    });
  }

  function handleUploadedFiles(files) {
    if (!files || !files.length || !photosGrid) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target.result;
        const card = document.createElement('div');
        card.className = 'gallery-tile-card';
        card.setAttribute('data-full', dataUrl);
        card.setAttribute('data-title', file.name.replace(/\.[^/.]+$/, "") || 'Uploaded Photograph');
        card.setAttribute('data-issuer', 'Personal Upload • Javaid Bashir Gallery');

        card.innerHTML = `
          <div class="tile-img-wrapper">
            <img src="${dataUrl}" alt="${file.name}" class="gallery-tile-img" loading="lazy">
            <div class="tile-inspect-overlay">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/><path d="M11 8v6M8 11h6"/></svg>
              <span>Inspect</span>
            </div>
          </div>
          <div class="tile-meta">
            <span class="tile-badge">User Upload</span>
            <h4 class="tile-name">${file.name.replace(/\.[^/.]+$/, "")}</h4>
            <p class="tile-desc">Uploaded photo added directly to your interactive visual collection.</p>
          </div>
        `;

        photosGrid.prepend(card);

        if (window.__bindTileCardLightbox) {
          window.__bindTileCardLightbox(card);
        }
      };
      reader.readAsDataURL(file);
    });
  }
}

/**
 * 9E. FULLSCREEN LIGHTBOX FOR HIGH-RES TILES
 */
function initImageLightbox() {
  const lightbox = document.getElementById('image-lightbox-modal');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxTitle = document.getElementById('lightbox-title');
  const lightboxIssuer = document.getElementById('lightbox-issuer');
  const closeBtn = document.getElementById('close-lightbox-btn');
  const backBtn = document.getElementById('lightbox-back-btn');
  const doneBtn = document.getElementById('lightbox-done-btn');

  if (!lightbox || !lightboxImg) return;

  let originModal = null;

  function openLightbox(src, title, issuer, parentModal) {
    originModal = parentModal || null;

    // Immediately auto-close the parent gallery window so the inspect window is directly shown
    if (originModal) {
      originModal.classList.remove('is-open');
      originModal.setAttribute('aria-hidden', 'true');
    }

    lightboxImg.src = src;
    lightboxImg.alt = title || 'Credential Inspection';
    if (lightboxTitle) lightboxTitle.textContent = title || '';
    if (lightboxIssuer) lightboxIssuer.textContent = issuer || '';

    // Show 'Back to Tiles' button if we came from a gallery popup
    if (backBtn) {
      backBtn.style.display = originModal ? 'inline-flex' : 'none';
    }

    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox(returnToOrigin = false) {
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');

    setTimeout(() => {
      if (lightboxImg) lightboxImg.src = '';
    }, 250);

    if (returnToOrigin && originModal) {
      originModal.classList.add('is-open');
      originModal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      originModal = null;
    }
  }

  function bindCard(card) {
    const handler = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const fullSrc = card.getAttribute('data-full');
      const title = card.getAttribute('data-title');
      const issuer = card.getAttribute('data-issuer');
      const parentModal = card.closest('.glass-modal-backdrop');

      if (fullSrc) {
        openLightbox(fullSrc, title, issuer, parentModal);
      }
    };

    card.addEventListener('click', handler);
    const overlay = card.querySelector('.tile-inspect-overlay');
    if (overlay) {
      overlay.addEventListener('click', handler);
    }
  }

  document.querySelectorAll('.gallery-tile-card').forEach(bindCard);
  window.__bindTileCardLightbox = bindCard;

  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      closeLightbox(false);
    });
  }

  if (doneBtn) {
    doneBtn.addEventListener('click', (e) => {
      e.preventDefault();
      closeLightbox(false);
    });
  }

  if (backBtn) {
    backBtn.addEventListener('click', (e) => {
      e.preventDefault();
      closeLightbox(true);
    });
  }

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) {
      closeLightbox(false);
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.classList.contains('is-open')) {
      closeLightbox(false);
    }
  });
}

/* ==========================================================================
   10. HERO KINETIC BLUR STAGGER CONTROLLER
   - Orchestrates initial optical blur slide-in on cover load
   - Runs periodic gentle optical ripple wave across words
   - Supports interactive hover micro-refraction
   ========================================================================== */
function initHeroKineticHeadline() {
  const headline = document.getElementById('hero-kinetic-headline');
  if (!headline) return;

  const words = headline.querySelectorAll('.kinetic-word');
  if (!words.length) return;

  // Ensure is-loaded class is applied after entrance transition
  setTimeout(() => {
    headline.classList.add('is-loaded');
  }, 350);

  // Periodic Kinetic Ripple Wave: Every 8.5 seconds, ripple across words
  let waveTimer = null;
  function scheduleNextWave() {
    waveTimer = setTimeout(() => {
      runWave();
      scheduleNextWave();
    }, 8500);
  }

  function runWave() {
    const rect = headline.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > window.innerHeight) return;

    words.forEach((word, index) => {
      setTimeout(() => {
        word.classList.remove('wave-active');
        void word.offsetWidth; // Force reflow
        word.classList.add('wave-active');

        setTimeout(() => {
          word.classList.remove('wave-active');
        }, 900);
      }, index * 65);
    });
  }

  // Initial wave after entrance settles (3.4 seconds after mount)
  setTimeout(() => {
    runWave();
    scheduleNextWave();
  }, 3400);
}

/* ==========================================================================
   11. HERO NAME INTERACTIVE 3D SPATIAL CONTROLLER
   - Applies loaded state for smooth initial 3D letter stagger
   - Interactive cursor proximity wave on JAVAID BASHIR characters
   ========================================================================== */
function initHeroNameInteractive() {
  const nameWrap = document.getElementById('hero-name-interactive');
  if (!nameWrap) return;

  nameWrap.classList.add('is-loaded');

  const chars = nameWrap.querySelectorAll('.name-char');
  if (!chars.length) return;

  nameWrap.addEventListener('mouseenter', () => {
    chars.forEach((char) => {
      char.style.animationPlayState = 'paused';
    });
  });

  nameWrap.addEventListener('mousemove', (e) => {
    const mouseX = e.clientX;

    chars.forEach((char) => {
      const charRect = char.getBoundingClientRect();
      const charCenter = charRect.left + charRect.width / 2;
      const dist = Math.abs(mouseX - charCenter);

      if (dist < 85) {
        const factor = (1 - dist / 85);
        char.style.transform = `translateY(${-8 * factor}px) scale(${1 + 0.12 * factor})`;
        if (!char.classList.contains('name-initial-char')) {
          char.style.filter = `drop-shadow(0 4px ${14 * factor}px rgba(255, 255, 255, 0.5))`;
        }
      } else {
        char.style.transform = '';
        char.style.filter = '';
      }
    });
  });

  nameWrap.addEventListener('mouseleave', () => {
    chars.forEach((char) => {
      char.style.transform = '';
      char.style.filter = '';
      char.style.animationPlayState = 'running';
    });
  });
}

/* ==========================================================================
   12. DOMAIN TAGS DANCING HOVER CONTROLLER
   - Deconstructs domain tags into individual dance-char spans
   - On hover, letters perform synchronized wave dance with electric blue glow
   - On mouseleave, smoothly returns characters to exact normal resting position
   ========================================================================== */
function initDomainTagsDancing() {
  const tags = document.querySelectorAll('.domain-tag, .tag-row .tag');
  tags.forEach(tag => {
    if (tag.querySelector('.dance-char')) return;

    const originalText = tag.textContent.trim();
    tag.setAttribute('data-original-text', originalText);
    tag.innerHTML = '';

    let charIndex = 0;
    for (let i = 0; i < originalText.length; i++) {
      const char = originalText[i];
      if (char === ' ') {
        const spaceSpan = document.createElement('span');
        spaceSpan.className = 'dance-space';
        spaceSpan.innerHTML = '&nbsp;';
        tag.appendChild(spaceSpan);
      } else {
        const span = document.createElement('span');
        span.className = 'dance-char';
        span.style.setProperty('--d-i', charIndex++);
        span.textContent = char;
        tag.appendChild(span);
      }
    }
  });
}


