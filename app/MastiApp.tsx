"use client";

import {
  ChangeEvent,
  CSSProperties,
  FormEvent,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ToffeeGame from "./ToffeeGame";

type Theme = "light" | "dark";
type PageName = "home" | "day-1" | "toffee-game";

type TeacherProfile = {
  name: string;
  role: string;
  hobbies: string[];
  photo: string;
};

const PROFILE_KEY = "masti-ki-pathshala-teacher";
const PROGRESS_KEY = "masti-ki-pathshala-day-1-stars";
const THEME_KEY = "masti-ki-pathshala-theme";
const SOUND_KEY = "masti-ki-pathshala-sound";
const STAR_COUNT = 16;

function pageFromHash(hash: string): PageName {
  if (hash === "#day-1") return "day-1";
  if (hash === "#toffee-game") return "toffee-game";
  return "home";
}

const emptyProfile: TeacherProfile = {
  name: "",
  role: "",
  hobbies: ["", "", ""],
  photo: "",
};

const celebrationPieces = Array.from({ length: 34 }, (_, index) => ({
  id: index,
  left: `${3 + ((index * 29) % 94)}%`,
  delay: `${(index % 9) * 0.12}s`,
  duration: `${3.8 + (index % 5) * 0.42}s`,
  color: ["#ff5d73", "#ffc53d", "#23c9a9", "#7758f6", "#38a8ff"][
    index % 5
  ],
  drift: `${-42 + ((index * 17) % 84)}px`,
}));

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function playApplause() {
  const AudioContextConstructor =
    window.AudioContext ||
    (
      window as typeof window & {
        webkitAudioContext?: typeof AudioContext;
      }
    ).webkitAudioContext;

  if (!AudioContextConstructor) return;

  const audioContext = new AudioContextConstructor();
  const sampleRate = audioContext.sampleRate;

  [0, 0.1, 0.21, 0.33, 0.47, 0.63, 0.8, 1.02, 1.25].forEach(
    (offset, clapIndex) => {
      const duration = 0.08 + (clapIndex % 3) * 0.015;
      const buffer = audioContext.createBuffer(
        1,
        Math.floor(sampleRate * duration),
        sampleRate,
      );
      const channel = buffer.getChannelData(0);

      for (let index = 0; index < channel.length; index += 1) {
        const fade = 1 - index / channel.length;
        channel[index] = (Math.random() * 2 - 1) * fade * fade;
      }

      const source = audioContext.createBufferSource();
      const filter = audioContext.createBiquadFilter();
      const gain = audioContext.createGain();

      filter.type = "bandpass";
      filter.frequency.value = 1250 + (clapIndex % 4) * 180;
      filter.Q.value = 0.7;
      gain.gain.setValueAtTime(
        0.0001,
        audioContext.currentTime + offset,
      );
      gain.gain.exponentialRampToValueAtTime(
        0.42,
        audioContext.currentTime + offset + 0.008,
      );
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        audioContext.currentTime + offset + duration,
      );

      source.buffer = buffer;
      source.connect(filter);
      filter.connect(gain);
      gain.connect(audioContext.destination);
      source.start(audioContext.currentTime + offset);
    },
  );

  window.setTimeout(() => {
    void audioContext.close();
  }, 2200);
}

function compressPhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("फ़ोटो पढ़ी नहीं जा सकी।"));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("यह फ़ोटो खोली नहीं जा सकी।"));
      image.onload = () => {
        const size = 640;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext("2d");

        if (!context) {
          reject(new Error("फ़ोटो तैयार नहीं हो सकी।"));
          return;
        }

        const cropSize = Math.min(image.width, image.height);
        const sourceX = (image.width - cropSize) / 2;
        const sourceY = (image.height - cropSize) / 2;
        context.drawImage(
          image,
          sourceX,
          sourceY,
          cropSize,
          cropSize,
          0,
          0,
          size,
          size,
        );
        resolve(canvas.toDataURL("image/jpeg", 0.84));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

function RevealCard({
  cardNumber,
  color,
  frontTitle,
  frontHint,
  revealed,
  onToggle,
  children,
}: {
  cardNumber: string;
  color: "coral" | "sun" | "mint";
  frontTitle: string;
  frontHint: string;
  revealed: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <button
      className={`reveal-card reveal-card--${color} ${
        revealed ? "is-revealed" : ""
      }`}
      type="button"
      onClick={onToggle}
      aria-pressed={revealed}
    >
      <span className="reveal-card__inner">
        <span className="reveal-card__face reveal-card__front">
          <span className="reveal-card__number">{cardNumber}</span>
          <span className="reveal-card__question">?</span>
          <strong>{frontTitle}</strong>
          <span>{frontHint}</span>
          <span className="reveal-card__action">पलटकर देखें ↗</span>
        </span>
        <span className="reveal-card__face reveal-card__back">
          {children}
          <span className="reveal-card__action">दोबारा छिपाएँ ↩</span>
        </span>
      </span>
    </button>
  );
}

export default function MastiApp() {
  const [page, setPage] = useState<PageName>("home");
  const [theme, setTheme] = useState<Theme>("light");
  const [soundOn, setSoundOn] = useState(true);
  const [profile, setProfile] = useState<TeacherProfile>(emptyProfile);
  const [draftProfile, setDraftProfile] =
    useState<TeacherProfile>(emptyProfile);
  const [stars, setStars] = useState<boolean[]>(
    Array.from({ length: STAR_COUNT }, () => false),
  );
  const [revealedCards, setRevealedCards] = useState([false, false, false]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [ready, setReady] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  const litStars = useMemo(
    () => stars.filter((star) => star).length,
    [stars],
  );

  const hasProfile =
    Boolean(profile.name.trim()) &&
    Boolean(profile.role.trim()) &&
    profile.hobbies.some((hobby) => hobby.trim());

  useEffect(() => {
    const storedProfile = safeParse<TeacherProfile>(
      window.localStorage.getItem(PROFILE_KEY),
      emptyProfile,
    );
    const storedStars = safeParse<boolean[]>(
      window.localStorage.getItem(PROGRESS_KEY),
      Array.from({ length: STAR_COUNT }, () => false),
    );
    const storedTheme =
      (window.localStorage.getItem(THEME_KEY) as Theme | null) ??
      (window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light");
    const storedSound = window.localStorage.getItem(SOUND_KEY);
    const initialPage = pageFromHash(window.location.hash);

    setProfile(storedProfile);
    setDraftProfile(storedProfile);
    setStars(
      storedStars.length === STAR_COUNT
        ? storedStars
        : Array.from({ length: STAR_COUNT }, () => false),
    );
    setTheme(storedTheme);
    setSoundOn(storedSound === null ? true : storedSound === "true");
    setPage(initialPage);
    document.documentElement.dataset.theme = storedTheme;
    setReady(true);

    const handleHashChange = () => {
      setPage(pageFromHash(window.location.hash));
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(stars));
  }, [ready, stars]);

  useEffect(() => {
    if (!celebrating) return;
    const timer = window.setTimeout(() => setCelebrating(false), 7500);
    return () => window.clearTimeout(timer);
  }, [celebrating]);

  const navigate = (nextPage: PageName) => {
    const nextHash =
      nextPage === "day-1"
        ? "#day-1"
        : nextPage === "toffee-game"
          ? "#toffee-game"
          : "#home";
    if (window.location.hash !== nextHash) {
      window.history.pushState(null, "", nextHash);
    }
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
    window.setTimeout(() => mainRef.current?.focus(), 350);
  };

  const toggleTheme = () => {
    const nextTheme: Theme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem(THEME_KEY, nextTheme);
  };

  const toggleSound = () => {
    const nextSound = !soundOn;
    setSoundOn(nextSound);
    window.localStorage.setItem(SOUND_KEY, String(nextSound));
  };

  const toggleStar = (index: number) => {
    const willComplete = !stars[index] && litStars === STAR_COUNT - 1;
    setStars((currentStars) =>
      currentStars.map((star, starIndex) =>
        starIndex === index ? !star : star,
      ),
    );

    if (willComplete) {
      setCelebrating(true);
      if (soundOn) playApplause();
    }
  };

  const resetDay = () => {
    const shouldReset = window.confirm(
      "क्या सभी 16 सितारे और खुले हुए कार्ड फिर से शुरू करें?",
    );
    if (!shouldReset) return;
    setStars(Array.from({ length: STAR_COUNT }, () => false));
    setRevealedCards([false, false, false]);
    setCelebrating(false);
  };

  const updateHobby = (index: number, value: string) => {
    setDraftProfile((currentProfile) => ({
      ...currentProfile,
      hobbies: currentProfile.hobbies.map((hobby, hobbyIndex) =>
        hobbyIndex === index ? value : hobby,
      ),
    }));
  };

  const handlePhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPhotoError("");

    if (!file.type.startsWith("image/")) {
      setPhotoError("कृपया JPG, PNG या दूसरी फ़ोटो फ़ाइल चुनें।");
      return;
    }

    try {
      const photo = await compressPhoto(file);
      setDraftProfile((currentProfile) => ({ ...currentProfile, photo }));
    } catch (error) {
      setPhotoError(
        error instanceof Error ? error.message : "फ़ोटो तैयार नहीं हो सकी।",
      );
    }
  };

  const saveProfile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanProfile = {
      ...draftProfile,
      name: draftProfile.name.trim(),
      role: draftProfile.role.trim(),
      hobbies: draftProfile.hobbies.map((hobby) => hobby.trim()),
    };
    setProfile(cleanProfile);
    window.localStorage.setItem(PROFILE_KEY, JSON.stringify(cleanProfile));
    setSettingsOpen(false);
  };

  const openSettings = () => {
    setDraftProfile(profile);
    setPhotoError("");
    setSettingsOpen(true);
  };

  const toggleReveal = (index: number) => {
    setRevealedCards((cards) =>
      cards.map((card, cardIndex) => (cardIndex === index ? !card : card)),
    );
  };

  return (
    <div className="site-shell">
      <a className="skip-link" href="#main-content">
        सीधे मुख्य भाग पर जाएँ
      </a>

      <header className="site-header">
        <button
          className="brand"
          type="button"
          onClick={() => navigate("home")}
          aria-label="मस्ती की पाठशाला का मुखपृष्ठ"
        >
          <span className="brand__spark" aria-hidden="true">
            ✦
          </span>
          <span>
            <strong>मस्ती की पाठशाला</strong>
            <small>गणित · खेल · दोस्ती</small>
          </span>
        </button>

        <nav className="main-nav" aria-label="मुख्य नेविगेशन">
          <button
            type="button"
            className={page === "home" ? "is-active" : ""}
            onClick={() => navigate("home")}
            aria-current={page === "home" ? "page" : undefined}
          >
            <span aria-hidden="true">🏠</span> मुखपृष्ठ
          </button>
          <button
            type="button"
            className={page === "day-1" ? "is-active" : ""}
            onClick={() => navigate("day-1")}
            aria-current={page === "day-1" ? "page" : undefined}
          >
            <span aria-hidden="true">🚀</span> दिन 1
          </button>
          <button
            type="button"
            className={page === "toffee-game" ? "is-active" : ""}
            onClick={() => navigate("toffee-game")}
            aria-current={page === "toffee-game" ? "page" : undefined}
          >
            <span aria-hidden="true">🍬</span> टॉफ़ी खेल
          </button>
        </nav>

        <div className="header-tools">
          <button
            className="tool-button"
            type="button"
            onClick={toggleSound}
            aria-pressed={soundOn}
            title={soundOn ? "आवाज़ बंद करें" : "आवाज़ चालू करें"}
          >
            <span aria-hidden="true">{soundOn ? "🔊" : "🔇"}</span>
            <span className="tool-button__text">
              {soundOn ? "आवाज़" : "शांत"}
            </span>
          </button>
          <button
            className="tool-button"
            type="button"
            onClick={toggleTheme}
            aria-label={
              theme === "light" ? "डार्क मोड चालू करें" : "लाइट मोड चालू करें"
            }
          >
            <span aria-hidden="true">{theme === "light" ? "🌙" : "☀️"}</span>
            <span className="tool-button__text">
              {theme === "light" ? "डार्क" : "लाइट"}
            </span>
          </button>
          <button
            className="tool-button"
            type="button"
            onClick={openSettings}
          >
            <span aria-hidden="true">⚙️</span>
            <span className="tool-button__text">मेरी जानकारी</span>
          </button>
        </div>
      </header>

      <main
        id="main-content"
        ref={mainRef}
        tabIndex={-1}
        className="main-content"
      >
        {page === "home" ? (
          <section className="home-page" aria-labelledby="home-title">
            <div className="math-doodle math-doodle--one" aria-hidden="true">
              ÷
            </div>
            <div className="math-doodle math-doodle--two" aria-hidden="true">
              +
            </div>
            <div className="math-doodle math-doodle--three" aria-hidden="true">
              π
            </div>

            <div className="hero-copy">
              <p className="eyebrow">
                <span aria-hidden="true">📍</span> GSSS Mariwara · कक्षा 7
              </p>
              <h1 id="home-title">
                <span className="hero-word hero-word--coral">मस्ती</span>
                <span className="hero-word hero-word--ink"> की </span>
                <span className="hero-word hero-word--purple">पाठशाला</span>
              </h1>
              <p className="hero-tagline">
                जहाँ <strong>गणित</strong> मिलता है खेल, हँसी और ढेर सारी
                जिज्ञासा से!
              </p>
              <button
                className="primary-button"
                type="button"
                onClick={() => navigate("day-1")}
              >
                दिन 1 शुरू करें
                <span aria-hidden="true">→</span>
              </button>
              <p className="hero-note">
                आज कोई परीक्षा नहीं — बस पहचान, बातचीत और चमकते सितारे।
              </p>
            </div>

            <div className="hero-playground" aria-hidden="true">
              <div className="hero-board">
                <span className="hero-board__pin hero-board__pin--one" />
                <span className="hero-board__pin hero-board__pin--two" />
                <p>आज का सूत्र</p>
                <strong>
                  सीखना + हँसना
                  <br />= शानदार दिन!
                </strong>
                <div className="chalk-line" />
                <span className="chalk-star">★</span>
                <span className="chalk-smile">◡̈</span>
              </div>
              <div className="floating-card floating-card--one">
                <span>16</span>
                <small>चमकते सितारे</small>
              </div>
              <div className="floating-card floating-card--two">
                <span>3</span>
                <small>मज़ेदार राज़</small>
              </div>
            </div>

            <div className="feature-strip">
              <article>
                <span aria-hidden="true">🃏</span>
                <div>
                  <strong>पहचान का खेल</strong>
                  <p>कार्ड पलटें और अपनी नई शिक्षक को जानें।</p>
                </div>
              </article>
              <article>
                <span aria-hidden="true">⭐</span>
                <div>
                  <strong>हर आवाज़ खास</strong>
                  <p>हर परिचय के बाद एक नया सितारा चमकेगा।</p>
                </div>
              </article>
              <article>
                <span aria-hidden="true">🎈</span>
                <div>
                  <strong>पूरी कक्षा की जीत</strong>
                  <p>16 सितारे पूरे होते ही जोरदार जश्न!</p>
                </div>
              </article>
            </div>
          </section>
        ) : page === "day-1" ? (
          <section className="day-page" aria-labelledby="day-title">
            <div className="day-heading">
              <div>
                <p className="eyebrow eyebrow--day">
                  <span aria-hidden="true">✨</span> हमारी पहली मुलाक़ात
                </p>
                <h1 id="day-title">
                  दिन 1 <span>— नमस्ते, दोस्तों!</span>
                </h1>
                <p>
                  आज हम एक-दूसरे को जानेंगे। पहले आप मेरे बारे में अंदाज़ा
                  लगाइए, फिर आपकी बारी!
                </p>
              </div>
              <button className="reset-button" type="button" onClick={resetDay}>
                <span aria-hidden="true">↺</span> फिर से शुरू करें
              </button>
            </div>

            {!hasProfile && (
              <aside className="setup-reminder" role="note">
                <span className="setup-reminder__icon" aria-hidden="true">
                  📸
                </span>
                <div>
                  <strong>कक्षा शुरू करने से पहले अपनी जानकारी जोड़ें</strong>
                  <p>
                    फ़ोटो, नाम, वर्तमान भूमिका और शौक केवल इसी डिवाइस पर सेव
                    होंगे।
                  </p>
                </div>
                <button type="button" onClick={openSettings}>
                  अभी जोड़ें
                </button>
              </aside>
            )}

            <section
              className="interaction-section intro-game"
              aria-labelledby="intro-game-title"
            >
              <div className="section-kicker">
                <span>खेल 1</span>
                <span className="section-kicker__line" />
                <span>अंदाज़ा लगाओ!</span>
              </div>
              <div className="section-heading">
                <div>
                  <h2 id="intro-game-title">पहचानो तो जानें</h2>
                  <p>
                    पहले बच्चों से अंदाज़ा लगवाएँ, फिर कार्ड पर क्लिक करके राज़
                    खोलें।
                  </p>
                </div>
                <div className="click-hint" aria-hidden="true">
                  <span>☝️</span> कार्ड पर क्लिक करें
                </div>
              </div>

              <div className="reveal-grid">
                <RevealCard
                  cardNumber="01"
                  color="coral"
                  frontTitle="कौन हूँ मैं?"
                  frontHint="नाम और चेहरा"
                  revealed={revealedCards[0]}
                  onToggle={() => toggleReveal(0)}
                >
                  <span className="profile-photo">
                    {profile.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={profile.photo}
                        alt={`${profile.name || "शिक्षक"} की तस्वीर`}
                      />
                    ) : (
                      <span className="profile-photo__placeholder">
                        <span aria-hidden="true">📷</span>
                        फ़ोटो जोड़ें
                      </span>
                    )}
                  </span>
                  <span className="card-label">मेरा नाम है</span>
                  <strong className="profile-name">
                    {profile.name || "अपना नाम जोड़ें"}
                  </strong>
                </RevealCard>

                <RevealCard
                  cardNumber="02"
                  color="sun"
                  frontTitle="आजकल क्या?"
                  frontHint="मेरी वर्तमान भूमिका"
                  revealed={revealedCards[1]}
                  onToggle={() => toggleReveal(1)}
                >
                  <span className="role-icon" aria-hidden="true">
                    💼
                  </span>
                  <span className="card-label">आजकल मैं...</span>
                  <strong className="profile-role">
                    {profile.role || "अपनी भूमिका जोड़ें"}
                  </strong>
                </RevealCard>

                <RevealCard
                  cardNumber="03"
                  color="mint"
                  frontTitle="मुझे क्या पसंद है?"
                  frontHint="मेरे शौक"
                  revealed={revealedCards[2]}
                  onToggle={() => toggleReveal(2)}
                >
                  <span className="hobby-icon" aria-hidden="true">
                    🎨
                  </span>
                  <span className="card-label">मेरे शौक</span>
                  <span className="hobby-list">
                    {profile.hobbies.some((hobby) => hobby.trim()) ? (
                      profile.hobbies
                        .filter((hobby) => hobby.trim())
                        .map((hobby) => (
                          <span key={hobby} className="hobby-pill">
                            {hobby}
                          </span>
                        ))
                    ) : (
                      <span className="hobby-pill">अपने शौक जोड़ें</span>
                    )}
                  </span>
                </RevealCard>
              </div>
            </section>

            <section
              className="interaction-section star-game"
              aria-labelledby="star-game-title"
            >
              <div className="section-kicker section-kicker--purple">
                <span>खेल 2</span>
                <span className="section-kicker__line" />
                <span>अब आपकी बारी!</span>
              </div>
              <div className="star-game__heading">
                <div>
                  <h2 id="star-game-title">हमारी कक्षा के 16 सितारे</h2>
                  <p>
                    हर विद्यार्थी के छोटे-से परिचय के बाद एक सितारे पर क्लिक
                    करें।
                  </p>
                </div>
                <div
                  className="star-counter"
                  aria-live="polite"
                  aria-label={`${STAR_COUNT} में से ${litStars} सितारे पूरे`}
                >
                  <strong>{litStars}</strong>
                  <span>/ {STAR_COUNT}</span>
                  <small>सितारे चमके</small>
                </div>
              </div>

              <div className="progress-track" aria-hidden="true">
                <span
                  style={{ width: `${(litStars / STAR_COUNT) * 100}%` }}
                />
              </div>

              <div className="star-grid">
                {stars.map((lit, index) => (
                  <button
                    key={`star-${index + 1}`}
                    className={`student-star ${lit ? "is-lit" : ""}`}
                    type="button"
                    onClick={() => toggleStar(index)}
                    aria-pressed={lit}
                    aria-label={
                      lit
                        ? `विद्यार्थी ${index + 1} का सितारा बुझाएँ`
                        : `विद्यार्थी ${index + 1} का सितारा जलाएँ`
                    }
                  >
                    <span className="student-star__number">{index + 1}</span>
                    <span className="student-star__shape" aria-hidden="true">
                      ★
                    </span>
                    <span className="student-star__label">
                      {lit ? "शानदार!" : "आपकी बारी"}
                    </span>
                  </button>
                ))}
              </div>

              <div className={`finish-message ${litStars === 16 ? "show" : ""}`}>
                <span aria-hidden="true">🎉</span>
                <strong>पूरी कक्षा चमक उठी!</strong>
                <span>16 आवाज़ें, एक शानदार टीम।</span>
              </div>
            </section>
          </section>
        ) : (
          <ToffeeGame soundOn={soundOn} />
        )}
      </main>

      <footer className="site-footer">
        <span>मस्ती की पाठशाला</span>
        <span aria-hidden="true">✦</span>
        <span>GSSS Mariwara</span>
        <span aria-hidden="true">✦</span>
        <span>गणित से दोस्ती</span>
      </footer>

      <div
        className={`modal-backdrop ${settingsOpen ? "is-open" : ""}`}
        aria-hidden={!settingsOpen}
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) setSettingsOpen(false);
        }}
      >
        <section
          className="settings-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="settings-title"
        >
          <div className="settings-modal__heading">
            <div>
              <p>केवल शिक्षक के लिए</p>
              <h2 id="settings-title">मेरी जानकारी</h2>
            </div>
            <button
              type="button"
              onClick={() => setSettingsOpen(false)}
              aria-label="सेटिंग बंद करें"
            >
              ×
            </button>
          </div>

          <form onSubmit={saveProfile}>
            <label className="photo-input">
              <span
                className={`photo-input__preview ${
                  draftProfile.photo ? "has-photo" : ""
                }`}
              >
                {draftProfile.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={draftProfile.photo} alt="चुनी गई तस्वीर" />
                ) : (
                  <span aria-hidden="true">📷</span>
                )}
              </span>
              <span>
                <strong>अपनी फ़ोटो चुनें</strong>
                <small>यह फ़ोटो केवल इस ब्राउज़र में सेव होगी।</small>
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhoto}
              />
            </label>
            {photoError && <p className="form-error">{photoError}</p>}

            <label className="form-field">
              <span>आपका नाम</span>
              <input
                required
                type="text"
                value={draftProfile.name}
                onChange={(event) =>
                  setDraftProfile((currentProfile) => ({
                    ...currentProfile,
                    name: event.target.value,
                  }))
                }
                placeholder="जैसे: अंजलि"
              />
            </label>

            <label className="form-field">
              <span>वर्तमान काम या भूमिका</span>
              <textarea
                required
                rows={2}
                value={draftProfile.role}
                onChange={(event) =>
                  setDraftProfile((currentProfile) => ({
                    ...currentProfile,
                    role: event.target.value,
                  }))
                }
                placeholder="जैसे: मैं ... में काम करती/करता हूँ"
              />
            </label>

            <fieldset>
              <legend>मेरे शौक</legend>
              <div className="hobby-fields">
                {draftProfile.hobbies.map((hobby, index) => (
                  <label className="form-field" key={`hobby-${index + 1}`}>
                    <span>शौक {index + 1}</span>
                    <input
                      required={index === 0}
                      type="text"
                      value={hobby}
                      onChange={(event) =>
                        updateHobby(index, event.target.value)
                      }
                      placeholder={
                        ["जैसे: किताबें पढ़ना", "जैसे: घूमना", "जैसे: संगीत"][
                          index
                        ]
                      }
                    />
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="privacy-note">
              <span aria-hidden="true">🔒</span>
              <p>
                यह जानकारी किसी सर्वर पर नहीं भेजी जाती। यह केवल इसी डिवाइस के
                ब्राउज़र में रहती है।
              </p>
            </div>

            <div className="modal-actions">
              <button
                className="secondary-button"
                type="button"
                onClick={() => setSettingsOpen(false)}
              >
                अभी नहीं
              </button>
              <button
                className="primary-button primary-button--small"
                type="submit"
              >
                जानकारी सेव करें
                <span aria-hidden="true">✓</span>
              </button>
            </div>
          </form>
        </section>
      </div>

      <div
        className={`celebration ${celebrating ? "is-celebrating" : ""}`}
        aria-hidden={!celebrating}
      >
        <div className="celebration__pieces" aria-hidden="true">
          {celebrationPieces.map((piece) => (
            <span
              key={piece.id}
              className={`celebration-piece celebration-piece--${
                piece.id % 3
              }`}
              style={
                {
                  "--piece-left": piece.left,
                  "--piece-delay": piece.delay,
                  "--piece-duration": piece.duration,
                  "--piece-color": piece.color,
                  "--piece-drift": piece.drift,
                } as CSSProperties
              }
            >
              {piece.id % 3 === 0 ? "🎈" : "★"}
            </span>
          ))}
        </div>
        <div className="celebration__card" role="status" aria-live="assertive">
          <span className="celebration__emoji" aria-hidden="true">
            🎉
          </span>
          <p>वाह, क्या बात है!</p>
          <h2>हमारे 16 सितारे चमक उठे!</h2>
          <span>पूरी कक्षा के लिए ज़ोरदार तालियाँ!</span>
          <button type="button" onClick={() => setCelebrating(false)}>
            शानदार! <span aria-hidden="true">👏</span>
          </button>
        </div>
      </div>
    </div>
  );
}
