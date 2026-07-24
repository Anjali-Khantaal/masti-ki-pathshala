"use client";

import { CSSProperties, useMemo, useState } from "react";

type BalloonGameProps = {
  soundOn: boolean;
};

type GameStage = "prompt" | "saved" | "valve" | "complete";

type ConnectionPrompt = {
  id: number;
  icon: string;
  statement: string;
  movement: string;
  chat: string;
  echo: string;
};

type ValveChallenge = {
  answer: number;
  choices: number[];
  equation: string;
  question: string;
  memoryHint: string;
};

const prompts: ConnectionPrompt[] = [
  {
    id: 1,
    icon: "🏏",
    statement: "जिन्हें कोई भी खेल खेलना पसंद है…",
    movement: "खड़े होकर दोनों हाथ ऊपर करें!",
    chat: "पास वाले दोस्त से पूछें—तुम्हारा पसंदीदा खेल कौन-सा है?",
    echo: "खेल वाली टीम—हाय-फाइव हवा में! 🙌",
  },
  {
    id: 2,
    icon: "🤝",
    statement: "जो घर पर किसी काम में मदद करते हैं…",
    movement: "एक हाथ ऊपर करें!",
    chat: "एक-दो बच्चे बताएँ—वे किस काम में मदद करते हैं?",
    echo: "पूरी कक्षा बोले—वाह, मददगार दोस्त!",
  },
  {
    id: 3,
    icon: "🗣️",
    statement: "जो एक से अधिक भाषा या बोली बोलते हैं…",
    movement: "दो उँगलियाँ दिखाएँ!",
    chat: "दो अलग भाषाओं या बोलियों में ‘नमस्ते’ सुनें।",
    echo: "सब साथ बोलें—हमारी आवाज़ें खास हैं!",
  },
  {
    id: 4,
    icon: "🎵",
    statement: "जिन्हें गाना या संगीत सुनना पसंद है…",
    movement: "एक मज़ेदार ताली बजाएँ!",
    chat: "कोई एक अपनी पसंद का गाना या संगीत बताए।",
    echo: "सब मिलकर वही ताली एक बार दोहराएँ!",
  },
  {
    id: 5,
    icon: "🌳",
    statement: "जिन्हें जानवर, पेड़ या प्रकृति पसंद है…",
    movement: "दोनों अंगूठे ऊपर करें!",
    chat: "पास वाले दोस्त को अपना पसंदीदा जानवर बताएँ।",
    echo: "तीन सेकंड की मज़ेदार जानवर आवाज़! 🐦",
  },
  {
    id: 6,
    icon: "🎨",
    statement: "जिन्हें चित्र बनाना या कुछ नया बनाना पसंद है…",
    movement: "हवा में एक बड़ा गोला बनाएँ!",
    chat: "एक-दो बच्चे बताएँ—वे क्या बनाना चाहेंगे?",
    echo: "सब हवा में अपनी पसंद की आकृति बनाएँ!",
  },
  {
    id: 7,
    icon: "💡",
    statement: "जिन्होंने कभी किसी दोस्त से कुछ नया सीखा है…",
    movement: "किसी दोस्त की ओर देखकर हाथ हिलाएँ!",
    chat: "कोई एक बताए—दोस्त ने क्या सिखाया?",
    echo: "अपने पास वाले से कहें—मुझे भी कुछ सिखाना!",
  },
  {
    id: 8,
    icon: "💜",
    statement: "जो इस कक्षा में गणित से दोस्ती करना चाहते हैं…",
    movement: "हाथों से दिल बनाएँ!",
    chat: "एक शब्द में बोलें—गणित कैसा होना चाहिए?",
    echo: "सब साथ बोलें—हम एक टीम हैं!",
  },
];

const burstPieces = Array.from({ length: 22 }, (_, index) => ({
  id: index,
  angle: `${(360 / 22) * index}deg`,
  distance: `${130 + (index % 5) * 34}px`,
  delay: `${(index % 4) * 0.025}s`,
  color: ["#ff5d73", "#ffc83d", "#22c9a8", "#7657f5", "#38a8ff"][
    index % 5
  ],
}));

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function makeChoices(answer: number, seed: number) {
  const candidates = [
    answer,
    answer === 0 ? 1 : answer - 1,
    answer + (answer < 3 ? 2 : 1),
  ];
  const unique = [...new Set(candidates)];

  while (unique.length < 3) {
    unique.push(unique[unique.length - 1] + 1);
  }

  const rotation = seed % 3;
  return [...unique.slice(rotation), ...unique.slice(0, rotation)];
}

function getValveChallenge(
  promptIndex: number,
  counts: Array<number | null>,
  classSize: number,
): ValveChallenge {
  const current = counts[promptIndex] ?? 0;
  const previous = counts[promptIndex - 1] ?? 0;
  const pairIndex = Math.floor(promptIndex / 2);

  if (pairIndex === 0) {
    const answer = previous + current;
    return {
      answer,
      choices: makeChoices(answer, pairIndex),
      equation: `${previous} + ${current} = ?`,
      question: "दोनों दौरों में कुल कितनी बार हाथ उठे?",
      memoryHint: `पहले ${previous} दोस्त, फिर ${current} दोस्त।`,
    };
  }

  if (pairIndex === 1) {
    const answer = classSize - current;
    return {
      answer,
      choices: makeChoices(answer, pairIndex),
      equation: `${classSize} − ${current} = ?`,
      question: "इस बार कितने दोस्त बैठे रहे या पास करना चुना?",
      memoryHint: `आज ${classSize} विद्यार्थी हैं और ${current} ने संकेत दिया।`,
    };
  }

  if (pairIndex === 2) {
    const answer = Math.abs(previous - current);
    const larger = Math.max(previous, current);
    const smaller = Math.min(previous, current);
    return {
      answer,
      choices: makeChoices(answer, pairIndex),
      equation: `${larger} − ${smaller} = ?`,
      question: "इन दोनों दौरों की गिनती में कितना अंतर है?",
      memoryHint: `गिनतियाँ थीं ${previous} और ${current}।`,
    };
  }

  const answer = previous + current;
  return {
    answer,
    choices: makeChoices(answer, pairIndex),
    equation: `${previous} + ${current} = ?`,
    question: "आख़िरी दो दौरों में कुल कितने संकेत मिले?",
    memoryHint: `पहले ${previous}, फिर ${current} संकेत।`,
  };
}

function playBalloonSound(kind: "inflate" | "valve" | "burst" | "finish") {
  const AudioContextConstructor =
    window.AudioContext ||
    (
      window as typeof window & {
        webkitAudioContext?: typeof AudioContext;
      }
    ).webkitAudioContext;

  if (!AudioContextConstructor) return;
  const audioContext = new AudioContextConstructor();

  if (kind === "burst") {
    const duration = 0.32;
    const buffer = audioContext.createBuffer(
      1,
      Math.floor(audioContext.sampleRate * duration),
      audioContext.sampleRate,
    );
    const channel = buffer.getChannelData(0);

    for (let index = 0; index < channel.length; index += 1) {
      const fade = 1 - index / channel.length;
      channel[index] = (Math.random() * 2 - 1) * fade * fade;
    }

    const source = audioContext.createBufferSource();
    const gain = audioContext.createGain();
    gain.gain.value = 0.28;
    source.buffer = buffer;
    source.connect(gain);
    gain.connect(audioContext.destination);
    source.start();
  } else {
    const frequencies =
      kind === "inflate"
        ? [220, 300]
        : kind === "valve"
          ? [520, 390, 280]
          : [523.25, 659.25, 783.99, 1046.5];

    frequencies.forEach((frequency, index) => {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const startsAt = audioContext.currentTime + index * 0.075;
      oscillator.type = kind === "inflate" ? "triangle" : "sine";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, startsAt);
      gain.gain.exponentialRampToValueAtTime(0.14, startsAt + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.0001, startsAt + 0.22);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start(startsAt);
      oscillator.stop(startsAt + 0.24);
    });
  }

  window.setTimeout(() => void audioContext.close(), 900);
}

export default function BalloonGame({ soundOn }: BalloonGameProps) {
  const [classSize, setClassSize] = useState(20);
  const [promptIndex, setPromptIndex] = useState(0);
  const [studentCount, setStudentCount] = useState(0);
  const [counts, setCounts] = useState<Array<number | null>>(
    Array.from({ length: prompts.length }, () => null),
  );
  const [stage, setStage] = useState<GameStage>("prompt");
  const [pressure, setPressure] = useState(18);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [valveSolved, setValveSolved] = useState(false);
  const [partnerHelpOpen, setPartnerHelpOpen] = useState(false);
  const [bursting, setBursting] = useState(false);
  const [burstCount, setBurstCount] = useState(0);

  const prompt = prompts[promptIndex];
  const hasStarted = counts.some((count) => count !== null);
  const totalSignals = counts.reduce<number>(
    (total, count) => total + (count ?? 0),
    0,
  );
  const completedPrompts = counts.filter((count) => count !== null).length;
  const pressureZone =
    pressure >= 84 ? "danger" : pressure >= 65 ? "warning" : "safe";
  const challenge = useMemo(
    () => getValveChallenge(promptIndex, counts, classSize),
    [classSize, counts, promptIndex],
  );

  const balloonStyle = {
    "--balloon-scale": 0.7 + (pressure / 100) * 0.48,
  } as CSSProperties;

  const submitCount = () => {
    const safeCount = clamp(studentCount, 0, classSize);
    setCounts((current) =>
      current.map((count, index) =>
        index === promptIndex ? safeCount : count,
      ),
    );
    setPressure((current) => Math.min(98, current + 14));
    if (soundOn) playBalloonSound("inflate");

    if (promptIndex % 2 === 1) {
      setStage("valve");
      setSelectedAnswer(null);
      setWrongAttempts(0);
      setValveSolved(false);
      setPartnerHelpOpen(false);
    } else {
      setStage("saved");
    }
  };

  const goToNextPrompt = () => {
    if (promptIndex === prompts.length - 1) {
      setStage("complete");
      if (soundOn) playBalloonSound("finish");
      return;
    }

    setPromptIndex((current) => current + 1);
    setStudentCount(0);
    setSelectedAnswer(null);
    setWrongAttempts(0);
    setValveSolved(false);
    setPartnerHelpOpen(false);
    setStage("prompt");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const chooseValveAnswer = (choice: number) => {
    if (valveSolved || bursting) return;
    setSelectedAnswer(choice);

    if (choice === challenge.answer) {
      setValveSolved(true);
      setPressure((current) => Math.max(18, current - 25));
      if (soundOn) playBalloonSound("valve");
      return;
    }

    const nextPressure = pressure + 12;
    setWrongAttempts((current) => current + 1);
    setPressure(Math.min(100, nextPressure));

    if (nextPressure >= 100) {
      setBursting(true);
      setBurstCount((current) => current + 1);
      if (soundOn) playBalloonSound("burst");
    }
  };

  const repairBalloon = () => {
    setPressure(32);
    setBursting(false);
    setSelectedAnswer(null);
    setWrongAttempts(0);
    setPartnerHelpOpen(true);
  };

  const resetGame = () => {
    const shouldReset = window.confirm(
      "क्या गुब्बारा खेल की पूरी प्रगति मिटाकर फिर से शुरू करें?",
    );
    if (!shouldReset) return;
    setClassSize(20);
    setPromptIndex(0);
    setStudentCount(0);
    setCounts(Array.from({ length: prompts.length }, () => null));
    setStage("prompt");
    setPressure(18);
    setSelectedAnswer(null);
    setWrongAttempts(0);
    setValveSolved(false);
    setPartnerHelpOpen(false);
    setBursting(false);
    setBurstCount(0);
  };

  if (stage === "complete") {
    return (
      <section className="balloon-page" aria-labelledby="balloon-title">
        <div className="balloon-finale">
          <div className="finale-confetti" aria-hidden="true">
            {burstPieces.map((piece) => (
              <span
                key={piece.id}
                style={{ color: piece.color }}
              >
                {piece.id % 3 === 0 ? "★" : "●"}
              </span>
            ))}
          </div>
          <span className="balloon-finale__balloon" aria-hidden="true">🎈</span>
          <p>मिशन पूरा!</p>
          <h1 id="balloon-title">हमारा गुब्बारा बच गया!</h1>
          <strong>क्योंकि हमने सुना, गिना और मिलकर सोचा।</strong>

          <div className="finale-stats">
            <article>
              <span>{completedPrompts}</span>
              <small>साझी बातें</small>
            </article>
            <article>
              <span>{totalSignals}</span>
              <small>कुल संकेत</small>
            </article>
            <article>
              <span>{burstCount}</span>
              <small>मज़ेदार मरम्मत</small>
            </article>
          </div>

          <div className="connection-recap">
            {prompts.map((item, index) => (
              <span key={item.id}>
                <b aria-hidden="true">{item.icon}</b>
                <strong>{counts[index] ?? 0}</strong>
              </span>
            ))}
          </div>

          <p className="finale-message">
            अब सब किसी ऐसे दोस्त की ओर हाथ हिलाएँ जिसके बारे में आज कुछ नया
            जाना। 👋
          </p>
          <button type="button" onClick={resetGame}>
            <span aria-hidden="true">↺</span> फिर से खेलें
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="balloon-page" aria-labelledby="balloon-title">
      <div className="balloon-heading">
        <div>
          <p className="eyebrow eyebrow--balloon">
            <span aria-hidden="true">🎈</span> साथ खड़े हों · साथ सोचें
          </p>
          <h1 id="balloon-title">गुब्बारा बचाओ!</h1>
          <p>
            साझा बातें खोजें, दोस्तों को सुनें और सही हिसाब से हवा बाहर
            निकालें।
          </p>
        </div>

        <div className="class-size-control">
          <span>आज की कक्षा</span>
          <div>
            <button
              type="button"
              onClick={() => setClassSize((current) => Math.max(1, current - 1))}
              disabled={hasStarted || classSize === 1}
              aria-label="विद्यार्थियों की संख्या एक घटाएँ"
            >
              −
            </button>
            <strong>{classSize}</strong>
            <button
              type="button"
              onClick={() => setClassSize((current) => Math.min(30, current + 1))}
              disabled={hasStarted || classSize === 30}
              aria-label="विद्यार्थियों की संख्या एक बढ़ाएँ"
            >
              +
            </button>
          </div>
          <small>{hasStarted ? "खेल शुरू हो चुका है" : "शुरू करने से पहले बदलें"}</small>
        </div>
      </div>

      <div className="belonging-note" role="note">
        <span aria-hidden="true">💜</span>
        <p>
          <strong>हमारा नियम:</strong> कोई जवाब देना या खड़ा होना ज़रूरी नहीं।
          बैठकर देखना भी टीम का हिस्सा होना है।
        </p>
      </div>

      <div className="balloon-progress" aria-label="आठ जुड़ाव दौर">
        {prompts.map((item, index) => (
          <span
            key={item.id}
            className={`${index === promptIndex ? "is-current" : ""} ${
              counts[index] !== null ? "is-complete" : ""
            }`}
            aria-label={`दौर ${item.id}${
              counts[index] !== null ? ", पूरा हुआ" : ""
            }`}
          >
            {counts[index] !== null ? "✓" : item.id}
          </span>
        ))}
      </div>

      <div className="balloon-lab">
        <article className="connection-card">
          <div className="connection-card__top">
            <span>जुड़ाव दौर {prompt.id} / {prompts.length}</span>
            <strong>हममें क्या एक जैसा है?</strong>
          </div>

          <span className="connection-card__icon" aria-hidden="true">
            {prompt.icon}
          </span>
          <h2>{prompt.statement}</h2>
          <p className="movement-prompt">{prompt.movement}</p>

          {stage === "prompt" ? (
            <>
              <div className="count-together">
                <p>सब मिलकर गिनें—कितने संकेत दिखे?</p>
                <div className="student-count-control">
                  <button
                    type="button"
                    onClick={() =>
                      setStudentCount((current) => Math.max(0, current - 1))
                    }
                    disabled={studentCount === 0}
                    aria-label="संकेत की गिनती एक घटाएँ"
                  >
                    −
                  </button>
                  <strong aria-live="polite">{studentCount}</strong>
                  <button
                    type="button"
                    onClick={() =>
                      setStudentCount((current) =>
                        Math.min(classSize, current + 1),
                      )
                    }
                    disabled={studentCount === classSize}
                    aria-label="संकेत की गिनती एक बढ़ाएँ"
                  >
                    +
                  </button>
                </div>
                <button
                  className="fill-balloon-button"
                  type="button"
                  onClick={submitCount}
                >
                  <span aria-hidden="true">💨</span> {studentCount} संकेतों की
                  हवा भरो
                </button>
              </div>
              <p className="optional-chat">
                <span aria-hidden="true">💬</span> {prompt.chat}
              </p>
            </>
          ) : stage === "saved" ? (
            <div className="connection-found">
              <span aria-hidden="true">✨</span>
              <div>
                <strong>{counts[promptIndex]} दोस्त—एक नया जुड़ाव!</strong>
                <p>{prompt.echo}</p>
              </div>
              <button type="button" onClick={goToNextPrompt}>
                अगला दौर <span aria-hidden="true">→</span>
              </button>
            </div>
          ) : (
            <div className="valve-challenge">
              <div className="valve-challenge__heading">
                <span aria-hidden="true">🧠</span>
                <div>
                  <strong>सुरक्षा वाल्व सवाल!</strong>
                  <p>मिलकर हल करें—सही जवाब हवा बाहर निकालेगा।</p>
                </div>
              </div>

              <p className="valve-memory">{challenge.memoryHint}</p>
              <div className="valve-equation">{challenge.equation}</div>
              <h3>{challenge.question}</h3>

              <div className="valve-choices">
                {challenge.choices.map((choice) => {
                  const isCorrect = valveSolved && choice === challenge.answer;
                  const isWrong =
                    !valveSolved && selectedAnswer === choice &&
                    choice !== challenge.answer;
                  return (
                    <button
                      type="button"
                      key={choice}
                      className={`${isCorrect ? "is-correct" : ""} ${
                        isWrong ? "is-wrong" : ""
                      }`}
                      onClick={() => chooseValveAnswer(choice)}
                      disabled={valveSolved || bursting}
                    >
                      {choice}
                      {isCorrect && <span aria-hidden="true">✓</span>}
                    </button>
                  );
                })}
              </div>

              {!valveSolved && !bursting && (
                <button
                  className="team-help-button"
                  type="button"
                  onClick={() => setPartnerHelpOpen(true)}
                >
                  <span aria-hidden="true">🤝</span> टीम से मदद लें
                </button>
              )}

              <div className="valve-feedback" aria-live="polite">
                {valveSolved ? (
                  <div className="valve-feedback__success">
                    <span aria-hidden="true">💨</span>
                    <p>
                      <strong>सही! वाल्व खुल गया।</strong>
                      हवा थोड़ी कम हुई—पूरी टीम सुरक्षित!
                    </p>
                  </div>
                ) : wrongAttempts > 0 && !bursting ? (
                  <div className="valve-feedback__retry">
                    <span aria-hidden="true">😮</span>
                    <p>
                      <strong>ओहो, गुब्बारा और बड़ा हो गया!</strong>
                      किसी दोस्त से तरीका सुनें और फिर कोशिश करें।
                    </p>
                  </div>
                ) : (
                  <p>जवाब ज़ोर से बोलें, फिर एक बटन चुनें।</p>
                )}
              </div>

              {valveSolved && (
                <button
                  className="continue-balloon-button"
                  type="button"
                  onClick={goToNextPrompt}
                >
                  {promptIndex === prompts.length - 1
                    ? "मिशन पूरा करें"
                    : "अगले जुड़ाव पर जाएँ"}{" "}
                  <span aria-hidden="true">→</span>
                </button>
              )}
            </div>
          )}
        </article>

        <aside className={`balloon-station balloon-station--${pressureZone}`}>
          <div className="pressure-heading">
            <span>गुब्बारे की हवा</span>
            <strong>{pressure}%</strong>
          </div>

          <div className="pressure-track" aria-hidden="true">
            <span style={{ width: `${pressure}%` }} />
          </div>

          <div className="balloon-stage" aria-live="polite">
            <div className="balloon-object" style={balloonStyle}>
              <span className="balloon-shine" />
              <span className="balloon-face" aria-hidden="true">
                {pressureZone === "danger"
                  ? "•﹏•"
                  : pressureZone === "warning"
                    ? "•ᴗ•"
                    : "◕‿◕"}
              </span>
              <span className="balloon-knot" />
            </div>
            <span className="balloon-string" aria-hidden="true" />
          </div>

          <div className="pressure-status">
            <span className="pressure-status__light" aria-hidden="true" />
            <div>
              <strong>
                {pressureZone === "danger"
                  ? "खतरे के पास!"
                  : pressureZone === "warning"
                    ? "अब ध्यान से…"
                    : "अभी सुरक्षित"}
              </strong>
              <p>
                {pressureZone === "danger"
                  ? "टीम से बात करें और वाल्व सवाल मिलकर हल करें।"
                  : pressureZone === "warning"
                    ? "अगला गलत जवाब हवा बढ़ाएगा।"
                    : "साझी बातें गुब्बारे में खुशी की हवा भरती हैं।"}
              </p>
            </div>
          </div>
        </aside>
      </div>

      {partnerHelpOpen && (
        <div className="partner-help" role="dialog" aria-modal="true">
          <div>
            <span aria-hidden="true">🤝</span>
            <p>10 सेकंड की दोस्त मदद</p>
            <h2>दो अलग बच्चों से तरीका सुनें</h2>
            <ol>
              <li>पहला बच्चा बताए—कौन-सा हिसाब करना है?</li>
              <li>दूसरा बच्चा बताए—जवाब कैसे मिला?</li>
              <li>फिर पूरी कक्षा एक जवाब बोले!</li>
            </ol>
            <button type="button" onClick={() => setPartnerHelpOpen(false)}>
              हमने बात कर ली ✓
            </button>
          </div>
        </div>
      )}

      {bursting && (
        <div className="balloon-burst" role="dialog" aria-modal="true">
          <div className="burst-star" aria-hidden="true">
            <span>धप्प!</span>
            {burstPieces.map((piece) => (
              <i
                key={piece.id}
                style={
                  {
                    "--burst-angle": piece.angle,
                    "--burst-distance": piece.distance,
                    "--burst-delay": piece.delay,
                    "--burst-color": piece.color,
                  } as CSSProperties
                }
              />
            ))}
          </div>
          <div className="burst-card">
            <span aria-hidden="true">🎈💥</span>
            <p>गुब्बारा फूटा… टीम नहीं!</p>
            <h2>गलती हुई तो क्या हुआ?</h2>
            <strong>सब साथ बोलें—“कोई बात नहीं, फिर कोशिश!”</strong>
            <button type="button" onClick={repairBalloon}>
              <span aria-hidden="true">🩹</span> दोस्ती की टेप लगाएँ
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
