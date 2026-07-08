import {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from 'react';
import heroImage from "./assets/hero1.png";
import thirdImage from './assets/3.jpeg';
import firstImage from './assets/1.1.1.jpg';

// ============================================================================
// IMAGE URLS
// ============================================================================

const HERO_IMAGE = heroImage;
const SECTION2_IMAGE =
firstImage
const SECTION3_IMG1 =
"https://eliteptla.com/wp-content/webp-express/webp-images/doc-root/wp-content/uploads/sites/11/2022/10/Dry-Needling.jpeg.webp"
const SECTION3_IMG2 =
'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTF8GfBZpmOU3tKykxdb2AWRG0hWdMzloyt7sNeUqqESurien0MoFMlzGg&s=10'
const SECTION3_BG = thirdImage;
// ============================================================================
// DATA CONSTANTS
// ============================================================================

const featureBars = ['Advanced Physiotherapy', 'Chiropractic Care', 'Pain Relief Treatments'];

const services: { name: string; num: string | null; active: boolean }[] = [
  { name: 'Neck\nPain\nTreatment', num: '01', active: true },
  { name: 'Back\nPain\nTherapy', num: '02', active: true },
  { name: 'Sports\nInjury\nRehab', num: '03', active: false },
  { name: 'Chiropractic\nCare', num: null, active: false },
];

const navLinks = ['Home', 'Services', 'About', 'Gallery', 'Contact'];

// ============================================================================
// TYPES
// ============================================================================

interface MaskPosition {
  x: number;
  y: number;
  sw: number;
  sh: number;
}

const ZERO_POSITION: MaskPosition = { x: 0, y: 0, sw: 0, sh: 0 };

// ============================================================================
// HOOKS
// ============================================================================

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches
  );

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 767px)');
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return isMobile;
}

function useMaskPositions(
  sectionRef: RefObject<HTMLElement | null>,
  cardRefs: RefObject<(HTMLElement | null)[]>,
  count: number
): MaskPosition[] {
  const [positions, setPositions] = useState<MaskPosition[]>(() =>
    Array.from({ length: count }, () => ZERO_POSITION)
  );

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const recompute = () => {
      const sectionRect = section.getBoundingClientRect();
      const sw = sectionRect.width;
      const sh = sectionRect.height;
      const next = cardRefs.current.map((card): MaskPosition => {
        if (!card) return { x: 0, y: 0, sw, sh };
        const cardRect = card.getBoundingClientRect();
        return {
          x: cardRect.left - sectionRect.left,
          y: cardRect.top - sectionRect.top,
          sw,
          sh,
        };
      });
      setPositions(next);
    };

    recompute();

    const ro = new ResizeObserver(recompute);
    ro.observe(section);

    return () => ro.disconnect();
  }, [sectionRef, cardRefs]);

  return positions;
}

function useImageWidth(bgImage: string, sectionHeight: number): number {
  const [renderWidth, setRenderWidth] = useState(0);

  useEffect(() => {
    if (!bgImage || !sectionHeight) return;
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      if (img.naturalHeight > 0) {
        setRenderWidth(img.naturalWidth * (sectionHeight / img.naturalHeight));
      }
    };
    img.src = bgImage;
    return () => {
      cancelled = true;
    };
  }, [bgImage, sectionHeight]);

  return renderWidth;
}

function useStaggeredReveal(_count: number, threshold: number = 0.15) {
  const containerRef = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        });
      },
      { threshold }
    );

    observer.observe(el);

    return () => observer.disconnect();
  }, [threshold]);

  const getAnimStyle = useCallback(
    (index: number): CSSProperties => ({
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(24px)',
      transition: `opacity 0.6s cubic-bezier(0.16,1,0.3,1) ${index * 120}ms, transform 0.6s cubic-bezier(0.16,1,0.3,1) ${index * 120}ms`,
    }),
    [visible]
  );

  return { containerRef, getAnimStyle };
}

// ============================================================================
// MASKED CARD
// ============================================================================

interface MaskedCardProps {
  bgImage: string;
  position: MaskPosition;
  imageWidth: number;
  focalX: number;
  className?: string;
  children?: ReactNode;
  cardRef?: (el: HTMLDivElement | null) => void;
  style?: CSSProperties;
}

function MaskedCard({
  bgImage,
  position,
  imageWidth,
  focalX,
  className,
  children,
  cardRef,
  style,
}: MaskedCardProps) {
  const overflow = imageWidth > position.sw ? imageWidth - position.sw : 0;
  const focalOffset = overflow * focalX;

  const bgStyle: CSSProperties = {
    backgroundImage: `url(${bgImage})`,
    backgroundSize: `auto ${position.sh}px`,
    backgroundPosition: `-${position.x + focalOffset}px -${position.y}px`,
    backgroundRepeat: 'no-repeat',
    ...style,
  };

  return (
    <div ref={cardRef} className={className} style={bgStyle}>
      {children}
    </div>
  );
}

// ============================================================================
// SPLASH SCREEN
// ============================================================================

function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [count, setCount] = useState(0);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    let current = 0;
    let exitTimeout: ReturnType<typeof setTimeout>;
    let completeTimeout: ReturnType<typeof setTimeout>;

    const interval = setInterval(() => {
      current += 1;
      setCount(current);
      if (current >= 100) {
        clearInterval(interval);
        exitTimeout = setTimeout(() => setExiting(true), 200);
        completeTimeout = setTimeout(() => onComplete(), 900);
      }
    }, 20);

    return () => {
      clearInterval(interval);
      clearTimeout(exitTimeout);
      clearTimeout(completeTimeout);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[100] bg-white flex items-end justify-start transition-opacity duration-700 ${
        exiting ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <span className="text-7xl md:text-9xl font-bold tabular-nums p-6 md:p-10 leading-none text-black">
        {count}
      </span>
    </div>
  );
}

// ============================================================================
// NAVBAR
// ============================================================================

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-6 py-2 md:py-3 bg-white/80 backdrop-blur-md">
        <div className="flex flex-col">
          <span className="text-xl md:text-2xl font-extrabold uppercase tracking-tight leading-none">
            Spinal
          </span>
          <span className="text-xl md:text-2xl font-extrabold uppercase tracking-tight leading-none -mt-1.5 md:-mt-2">
            Health
          </span>
          <span className="text-[8px] md:text-[9px] font-medium leading-none mt-1.5 md:mt-2">
            quality healthcare
          </span>
        </div>

        <div className="hidden md:flex items-center gap-6">
          <button
            type="button"
            className="px-6 py-3 bg-white rounded-full border border-black text-sm font-semibold hover:bg-black hover:text-white transition-colors duration-200"
          >
            Menu
          </button>
          <span className="text-sm font-semibold text-black">Spinal Emergency</span>
        </div>

        <button
          type="button"
          aria-label="Toggle menu"
          className="md:hidden w-10 h-10 flex items-center justify-center relative"
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span
            className={`absolute h-0.5 w-6 bg-black rounded-full transition-all duration-300 ease-[cubic-bezier(0.76,0,0.24,1)] ${
              menuOpen ? 'rotate-45 translate-y-0' : '-translate-y-2'
            }`}
          />
          <span
            className={`absolute h-0.5 w-6 bg-black rounded-full transition-all duration-300 ease-[cubic-bezier(0.76,0,0.24,1)] ${
              menuOpen ? 'opacity-0 scale-x-0' : 'opacity-100 scale-x-100'
            }`}
          />
          <span
            className={`absolute h-0.5 w-6 bg-black rounded-full transition-all duration-300 ease-[cubic-bezier(0.76,0,0.24,1)] ${
              menuOpen ? '-rotate-45 translate-y-0' : 'translate-y-2'
            }`}
          />
        </button>
      </nav>

      <div className={`fixed inset-0 z-40 md:hidden ${menuOpen ? '' : 'pointer-events-none'}`}>
        <div
          className={`absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-500 ${
            menuOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setMenuOpen(false)}
        />
        <div
          className={`absolute top-0 right-0 h-full w-[85%] max-w-sm bg-white shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] ${
            menuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex flex-col justify-center h-full px-8 gap-1">
            {navLinks.map((link, i) => (
              <a
                key={link}
                href="#"
                className={`text-4xl font-bold text-black hover:text-neutral-500 transition-all duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] ${
                  menuOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
                }`}
                style={{ transitionDelay: menuOpen ? `${100 + i * 60}ms` : '0ms' }}
              >
                {link}
              </a>
            ))}

            <div
              className="mt-8 pt-8 border-t border-neutral-200 transition-all duration-500 ease-[cubic-bezier(0.76,0,0.24,1)]"
              style={{
                opacity: menuOpen ? 1 : 0,
                transform: menuOpen ? 'translateX(0)' : 'translateX(32px)',
                transitionDelay: menuOpen ? '450ms' : '0ms',
              }}
            >
              <p className="text-sm font-semibold text-black mb-4">Spinal Emergency</p>
              <button
                type="button"
                className="w-full px-6 py-4 bg-black rounded-full text-white text-sm font-semibold hover:bg-neutral-800 transition-colors duration-200"
              >
                Book Appointment
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ============================================================================
// SECTION 1 - HERO
// ============================================================================

function Section1() {
  const isMobile = useIsMobile();
  const sectionRef = useRef<HTMLElement | null>(null);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);
  const s1Reveal = useStaggeredReveal(4);

  const positions = useMaskPositions(sectionRef, cardRefs, 4);
  const sectionHeight = positions[0]?.sh ?? 0;
  const imageWidth = useImageWidth(HERO_IMAGE, sectionHeight);
  const focalX = isMobile ? 0.7 : 0.8;

  const setSectionRef = useCallback(
    (el: HTMLElement | null) => {
      sectionRef.current = el;
      s1Reveal.containerRef.current = el;
    },
    [s1Reveal.containerRef]
  );

  return (
    <section
      ref={setSectionRef}
      className="h-screen w-full overflow-hidden flex flex-col pt-24 md:pt-24 px-3 md:px-5 pb-1.5 md:pb-2 gap-1.5 md:gap-2"
    >
      {featureBars.map((label, i) => (
        <MaskedCard
          key={label}
          bgImage={HERO_IMAGE}
          position={positions[i] ?? ZERO_POSITION}
          imageWidth={imageWidth}
          focalX={focalX}
          cardRef={(el) => {
            cardRefs.current[i] = el;
          }}
          className="w-full h-14 md:h-20 shrink-0 rounded-xl md:rounded-2xl overflow-hidden relative"
          style={s1Reveal.getAnimStyle(i)}
        >
          <span className="flex items-center justify-center h-full text-black text-lg md:text-3xl font-bold text-center relative z-10">
            {label}
          </span>
        </MaskedCard>
      ))}

      <MaskedCard
        bgImage={HERO_IMAGE}
        position={positions[3] ?? ZERO_POSITION}
        imageWidth={imageWidth}
        focalX={focalX}
        cardRef={(el) => {
          cardRefs.current[3] = el;
        }}
        className="w-full flex-1 min-h-0 rounded-xl md:rounded-2xl overflow-hidden relative"
        style={s1Reveal.getAnimStyle(3)}
      >
        <p className="absolute top-4 left-4 md:top-7 md:left-7 text-black text-xs md:text-sm font-semibold leading-4 md:leading-5 max-w-[200px] md:max-w-[300px] z-10">
           Founder of The Spinewala 
           <br />
           Physiotherapy & Chiropractic
          <br />
          Clinic in Pune
        </p>

        <div className="absolute bottom-5 left-3 md:bottom-8 md:left-4 z-10">
          <span className="block text-black text-xs md:text-sm font-semibold mb-1 md:mb-2">
            Focus on Orthopedic and sports Physiotherapy
          </span>
          <h1 className="text-black text-[clamp(3rem,9vw,5rem)] font-bold leading-[0.79] tracking-tight">
            Dr. Sanvad 
            <br />
            <br />
            Anand Samudre
          </h1>
        </div>

        <span className="absolute bottom-6 right-4 md:bottom-10 md:right-8 text-white text-xs md:text-sm font-semibold z-10">
          Free Consultation
        </span>
      </MaskedCard>
    </section>
  );
}

// ============================================================================
// SECTION 2 - SMILE GALLERY
// ============================================================================

function Section2() {
  const isMobile = useIsMobile();
  const sectionRef = useRef<HTMLElement | null>(null);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);
  const s2Reveal = useStaggeredReveal(4);

  const positions = useMaskPositions(sectionRef, cardRefs, 4);
  const sectionHeight = positions[0]?.sh ?? 0;
  const imageWidth = useImageWidth(SECTION2_IMAGE, sectionHeight);
  const focalX = isMobile ? 0.65 : 0.8;

  const setSectionRef = useCallback(
    (el: HTMLElement | null) => {
      sectionRef.current = el;
      s2Reveal.containerRef.current = el;
    },
    [s2Reveal.containerRef]
  );

  return (
    <section
      ref={setSectionRef}
      className="min-h-screen md:h-screen w-full overflow-hidden flex flex-col pt-1.5 md:pt-2 px-3 md:px-5 pb-1.5 md:pb-2 gap-1.5 md:gap-2"
    >
      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 grid-rows-[auto_auto_auto_auto] md:grid-rows-[1fr_1fr_0.8fr] gap-1.5 md:gap-2">
        <MaskedCard
          bgImage={SECTION2_IMAGE}
          position={positions[0] ?? ZERO_POSITION}
          imageWidth={imageWidth}
          focalX={focalX}
          cardRef={(el) => {
            cardRefs.current[0] = el;
          }}
          className="rounded-xl md:rounded-2xl overflow-hidden relative min-h-[160px] md:min-h-0"
          style={s2Reveal.getAnimStyle(0)}
        >
          <h3 className="absolute top-4 left-5 md:top-6 md:left-7 text-white md:text-black text-2xl md:text-3xl font-bold z-10">
            Recovery Gallery
          </h3>
          <p className="absolute bottom-4 left-5 md:bottom-6 md:left-7 text-white md:text-black text-xs md:text-sm font-semibold z-10">
            Helping patients recover
            <br />
            from pain, injury,
            <br />
            and spinal conditions.
          </p>
        </MaskedCard>

        <MaskedCard
          bgImage={SECTION2_IMAGE}
          position={positions[1] ?? ZERO_POSITION}
          imageWidth={imageWidth}
          focalX={focalX}
          cardRef={(el) => {
            cardRefs.current[1] = el;
          }}
          className="md:row-span-2 rounded-xl md:rounded-2xl overflow-hidden relative min-h-[200px] md:min-h-0"
          style={s2Reveal.getAnimStyle(1)}
        >
          <p className="absolute bottom-16 left-5 md:bottom-20 md:left-7 text-white text-xs md:text-sm font-semibold leading-4 md:leading-5 z-10">
            Real treatment moments and patient recovery journeys at 
            <br />
            The Spinewala Physiotherapy & Chiropractic Clinic.
          </p>
          <button
            type="button"
            className="absolute bottom-4 right-4 md:bottom-6 md:right-6 px-5 py-3 md:px-8 md:py-5 bg-white rounded-full text-black text-base md:text-xl font-bold z-10 hover:scale-105 transition-transform"
          >
            Book Appointment
          </button>
        </MaskedCard>

        <MaskedCard
          bgImage={SECTION2_IMAGE}
          position={positions[2] ?? ZERO_POSITION}
          imageWidth={imageWidth}
          focalX={focalX}
          cardRef={(el) => {
            cardRefs.current[2] = el;
          }}
          className="rounded-xl md:rounded-2xl overflow-hidden relative min-h-[160px] md:min-h-0"
          style={s2Reveal.getAnimStyle(2)}
        >
          <h3 className="absolute top-4 left-5 md:top-6 md:left-7 text-white md:text-black text-[clamp(3rem,7vw,6rem)] font-bold leading-[0.9] z-10">
            Pain Relief 
            <br />
            Programs
          </h3>
        </MaskedCard>

        <MaskedCard
          bgImage={SECTION2_IMAGE}
          position={positions[3] ?? ZERO_POSITION}
          imageWidth={imageWidth}
          focalX={focalX}
          cardRef={(el) => {
            cardRefs.current[3] = el;
          }}
          className="col-span-1 md:col-span-2 rounded-xl md:rounded-2xl overflow-hidden relative min-h-[200px] md:min-h-0"
          style={s2Reveal.getAnimStyle(3)}
        >
          <div className="absolute inset-0 z-10 flex flex-wrap md:flex-nowrap gap-1.5 md:gap-2 p-2 md:p-3">
            {services.map((svc) => (
              <div
                key={svc.name}
                className={`flex-1 min-w-[calc(50%-4px)] md:min-w-0 rounded-xl md:rounded-2xl p-3 md:p-5 flex flex-col justify-between ${
                  svc.active ? 'bg-white/90 backdrop-blur-md' : 'bg-white/20 backdrop-blur-xl'
                }`}
              >
                <h3
                  className={`text-xl md:text-4xl font-bold leading-[1.05] whitespace-pre-line ${
                    svc.active ? 'text-black' : 'text-white'
                  }`}
                >
                  {svc.name}
                </h3>
                {svc.num && (
                  <span
                    className={`self-end w-8 h-8 md:w-12 md:h-12 rounded-full border flex items-center justify-center text-xs md:text-sm font-semibold ${
                      svc.active ? 'border-black text-black' : 'border-white text-white'
                    }`}
                  >
                    {svc.num}
                  </span>
                )}
              </div>
            ))}
          </div>
        </MaskedCard>
      </div>
    </section>
  );
}

// ============================================================================
// SECTION 3 - IMPLANT DENTISTRY
// ============================================================================

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className={className}>
      <path
        d="M1 7h12m0 0L8 2m5 5L8 12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Section3() {
  const s3Reveal = useStaggeredReveal(4);

  return (
    <section
      ref={s3Reveal.containerRef}
      className="min-h-screen md:h-screen w-full overflow-hidden flex flex-col pt-1.5 md:pt-2 px-3 md:px-5 pb-1.5 md:pb-2 gap-1.5 md:gap-2"
    >
      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 gap-1.5 md:gap-2">
        <div className="flex flex-col gap-1.5 md:gap-2">
          <div
            className="rounded-xl md:rounded-2xl bg-stone-50 p-5 md:p-7 flex flex-col justify-between flex-[1.2] min-h-[180px] md:min-h-0"
            style={s3Reveal.getAnimStyle(0)}
          >
            <h2 className="text-[clamp(3rem,7vw,6.5rem)] font-bold leading-[0.95] text-black">
              Spinal
              <br />
              Rehabilitation
            </h2>
            <p className="text-xs md:text-sm font-semibold text-black">Restore Mobility • Relieve Pain • Improve Quality of Life</p>
          </div>

          <div
            className="flex gap-1.5 md:gap-2 flex-1 min-h-[140px] md:min-h-0"
            style={s3Reveal.getAnimStyle(1)}
          >
            <div className="flex-1 rounded-xl md:rounded-2xl overflow-hidden">
              <img
                src={SECTION3_IMG1}
                alt="Dry Needling"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 rounded-xl md:rounded-2xl overflow-hidden">
              <img
                src={SECTION3_IMG2}
                alt="Chiropractic Adjustment"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div
            className="rounded-xl md:rounded-2xl bg-zinc-200 p-5 md:p-7 flex items-end justify-between flex-[0.8] min-h-[160px] md:min-h-0"
            style={s3Reveal.getAnimStyle(2)}
          >
            <div>
              <p className="text-xs md:text-sm font-semibold text-black mb-2 md:mb-3">
                Consultation
              </p>
              <h3 className="text-xl md:text-3xl font-bold text-black leading-6 md:leading-8">
                Personalized
                <br />
                Spine Care
                <br />
                Programs
                <br />
                
              </h3>
             </div>
            <button
              type="button"
              className="px-5 py-3 md:px-8 md:py-5 bg-white rounded-full text-black text-base md:text-xl font-bold hover:scale-105 transition-transform"
            >
              Book Appointment
            </button>
          </div>
        </div>

        <div
          className="rounded-xl md:rounded-2xl overflow-hidden relative min-h-[350px] md:min-h-0"
          style={s3Reveal.getAnimStyle(3)}
        >
          <img
            src={SECTION3_BG}
            alt="Smiling patient"
            className="w-full h-full object-cover"
          />

          <div className="absolute bottom-3 left-3 right-3 md:bottom-5 md:left-5 md:right-5 flex gap-1.5 md:gap-2">
            <div className="flex-1 bg-white rounded-xl md:rounded-2xl p-3 md:p-5 flex flex-col justify-between h-36 md:h-52">
              <h4 className="text-lg md:text-2xl font-bold text-black leading-5 md:leading-7">
                How Your
                <br />
                Recovery Begins
              </h4>
              <span className="self-end w-9 h-9 md:w-12 md:h-12 rounded-full border border-black flex items-center justify-center">
                <ArrowIcon className="rotate-[-45deg]" />
              </span>
            </div>

            <div className="flex-1 bg-white/20 backdrop-blur-xl rounded-xl md:rounded-2xl p-3 md:p-5 flex flex-col justify-between h-36 md:h-52">
              <h4 className="text-lg md:text-2xl font-bold text-white leading-5 md:leading-7">
                Posture &
                <br />
                Spinal Health
              </h4>
              <span className="self-end w-9 h-9 md:w-12 md:h-12 rounded-full border border-white flex items-center justify-center">
                <ArrowIcon className="rotate-[-45deg] text-white" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// APP
// ============================================================================

function App() {
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashComplete = useCallback(() => setShowSplash(false), []);

  return (
    <div className="bg-white">
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
      <Navbar />
      <Section1 />
      <Section2 />
      <Section3 />
    </div>
  );
}

export default App;
