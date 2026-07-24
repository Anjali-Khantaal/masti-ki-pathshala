"use client";

import { useMemo, useState } from "react";

type ToffeeGameProps = {
  soundOn: boolean;
};

type RoundResult = {
  attempts: number;
  firstTry: boolean;
};

type ToffeeRound = {
  id: number;
  level: "गरमजोशी" | "थोड़ा सोचो" | "सुपर चुनौती";
  skill: "जोड़" | "घटाव" | "गुणा" | "बराबर बाँटना";
  child: string;
  childEmoji: string;
  friend: string;
  friendEmoji: string;
  start: number;
  change: number;
  operator: "+" | "−" | "×" | "÷";
  action: string;
  question: string;
  answer: number;
  choices: number[];
  visual: "change" | "groups" | "share";
  groups?: number;
  perGroup?: number;
};

const rounds: ToffeeRound[] = [
  {
    id: 1,
    level: "गरमजोशी",
    skill: "जोड़",
    child: "मीना",
    childEmoji: "👧🏽",
    friend: "गुड़िया",
    friendEmoji: "👧🏽",
    start: 4,
    change: 3,
    operator: "+",
    action: "गुड़िया ने मीना को 3 टॉफ़ियाँ और दीं।",
    question: "अब मीना के पास कितनी टॉफ़ियाँ हैं?",
    answer: 7,
    choices: [6, 7, 8],
    visual: "change",
  },
  {
    id: 2,
    level: "गरमजोशी",
    skill: "घटाव",
    child: "राजू",
    childEmoji: "👦🏽",
    friend: "अमन",
    friendEmoji: "🧒🏽",
    start: 8,
    change: 3,
    operator: "−",
    action: "अमन ने राजू से 3 टॉफ़ियाँ माँगीं।",
    question: "देने के बाद राजू के पास कितनी टॉफ़ियाँ बचीं?",
    answer: 5,
    choices: [4, 5, 6],
    visual: "change",
  },
  {
    id: 3,
    level: "थोड़ा सोचो",
    skill: "जोड़",
    child: "आशा",
    childEmoji: "👧🏽",
    friend: "नानी",
    friendEmoji: "👵🏽",
    start: 9,
    change: 6,
    operator: "+",
    action: "नानी ने आशा को 6 टॉफ़ियाँ और दे दीं।",
    question: "अब आशा के पास कुल कितनी टॉफ़ियाँ हैं?",
    answer: 15,
    choices: [14, 15, 16],
    visual: "change",
  },
  {
    id: 4,
    level: "थोड़ा सोचो",
    skill: "घटाव",
    child: "इमरान",
    childEmoji: "👦🏽",
    friend: "छोटी बहन",
    friendEmoji: "👧🏽",
    start: 14,
    change: 6,
    operator: "−",
    action: "इमरान ने अपनी छोटी बहन को 6 टॉफ़ियाँ दीं।",
    question: "इमरान के पास अब कितनी टॉफ़ियाँ बचीं?",
    answer: 8,
    choices: [7, 8, 9],
    visual: "change",
  },
  {
    id: 5,
    level: "सुपर चुनौती",
    skill: "जोड़",
    child: "पूजा",
    childEmoji: "👧🏽",
    friend: "मौसी",
    friendEmoji: "👩🏽",
    start: 18,
    change: 7,
    operator: "+",
    action: "मौसी ने पूजा को 7 टॉफ़ियाँ और दीं।",
    question: "पूजा की डिब्बी में अब कितनी टॉफ़ियाँ हैं?",
    answer: 25,
    choices: [24, 25, 26],
    visual: "change",
  },
  {
    id: 6,
    level: "सुपर चुनौती",
    skill: "घटाव",
    child: "सोनू",
    childEmoji: "🧒🏽",
    friend: "दोस्त",
    friendEmoji: "👦🏽",
    start: 23,
    change: 8,
    operator: "−",
    action: "सोनू ने अपने दोस्त को 8 टॉफ़ियाँ दीं।",
    question: "सोनू के पास कितनी टॉफ़ियाँ बचीं?",
    answer: 15,
    choices: [14, 15, 16],
    visual: "change",
  },
  {
    id: 7,
    level: "सुपर चुनौती",
    skill: "गुणा",
    child: "कविता",
    childEmoji: "👧🏽",
    friend: "4 दोस्त",
    friendEmoji: "🧒🏽",
    start: 4,
    change: 3,
    operator: "×",
    action: "कविता ने 4 पुड़ियों में 3-3 टॉफ़ियाँ रखीं।",
    question: "सभी पुड़ियों में कुल कितनी टॉफ़ियाँ हैं?",
    answer: 12,
    choices: [7, 12, 16],
    visual: "groups",
    groups: 4,
    perGroup: 3,
  },
  {
    id: 8,
    level: "सुपर चुनौती",
    skill: "बराबर बाँटना",
    child: "मोहन",
    childEmoji: "👦🏽",
    friend: "5 दोस्त",
    friendEmoji: "👧🏽",
    start: 20,
    change: 5,
    operator: "÷",
    action: "मोहन ने 20 टॉफ़ियाँ 5 दोस्तों में बराबर बाँटीं।",
    question: "हर दोस्त को कितनी टॉफ़ियाँ मिलीं?",
    answer: 4,
    choices: [3, 4, 5],
    visual: "share",
    groups: 5,
    perGroup: 4,
  },
];

function playSuccessSound() {
  const AudioContextConstructor =
    window.AudioContext ||
    (
      window as typeof window & {
        webkitAudioContext?: typeof AudioContext;
      }
    ).webkitAudioContext;

  if (!AudioContextConstructor) return;

  const audioContext = new AudioContextConstructor();
  const notes = [523.25, 659.25, 783.99];

  notes.forEach((frequency, index) => {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const startsAt = audioContext.currentTime + index * 0.09;

    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, startsAt);
    gain.gain.exponentialRampToValueAtTime(0.22, startsAt + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, startsAt + 0.28);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(startsAt);
    oscillator.stop(startsAt + 0.3);
  });

  window.setTimeout(() => void audioContext.close(), 900);
}

function CandyPieces({
  count,
  muted = false,
}: {
  count: number;
  muted?: boolean;
}) {
  return (
    <span
      className={`candy-pieces ${muted ? "candy-pieces--muted" : ""}`}
      aria-label={`${count} टॉफ़ियाँ`}
    >
      {Array.from({ length: count }, (_, index) => (
        <span
          className={`candy-piece candy-piece--${index % 4}`}
          aria-hidden="true"
          key={`candy-${index + 1}`}
        >
          🍬
        </span>
      ))}
    </span>
  );
}

function CandyGroups({
  groups,
  perGroup,
  label,
}: {
  groups: number;
  perGroup: number;
  label: string;
}) {
  return (
    <div className="candy-groups" aria-label={label}>
      {Array.from({ length: groups }, (_, groupIndex) => (
        <div className="candy-packet" key={`packet-${groupIndex + 1}`}>
          <span className="candy-packet__number">{groupIndex + 1}</span>
          <CandyPieces count={perGroup} />
        </div>
      ))}
    </div>
  );
}

export default function ToffeeGame({ soundOn }: ToffeeGameProps) {
  const [roundIndex, setRoundIndex] = useState(0);
  const [attempts, setAttempts] = useState<number[]>(
    Array.from({ length: rounds.length }, () => 0),
  );
  const [lastChoices, setLastChoices] = useState<Array<number | null>>(
    Array.from({ length: rounds.length }, () => null),
  );
  const [results, setResults] = useState<Array<RoundResult | null>>(
    Array.from({ length: rounds.length }, () => null),
  );
  const [teacherPanelOpen, setTeacherPanelOpen] = useState(false);

  const round = rounds[roundIndex];
  const result = results[roundIndex];
  const selectedChoice = lastChoices[roundIndex];
  const completedRounds = results.filter(Boolean).length;
  const firstTryRounds = results.filter((item) => item?.firstTry).length;

  const skillSummary = useMemo(
    () =>
      ["जोड़", "घटाव", "गुणा", "बराबर बाँटना"].map((skill) => {
        const matchingRounds = rounds
          .map((item, index) => ({ item, index }))
          .filter(({ item }) => item.skill === skill);
        const completed = matchingRounds.filter(
          ({ index }) => results[index],
        ).length;
        const firstTry = matchingRounds.filter(
          ({ index }) => results[index]?.firstTry,
        ).length;

        return {
          skill,
          total: matchingRounds.length,
          completed,
          firstTry,
        };
      }),
    [results],
  );

  const chooseAnswer = (choice: number) => {
    if (result) return;

    const nextAttemptCount = attempts[roundIndex] + 1;
    setAttempts((current) =>
      current.map((count, index) =>
        index === roundIndex ? nextAttemptCount : count,
      ),
    );
    setLastChoices((current) =>
      current.map((value, index) => (index === roundIndex ? choice : value)),
    );

    if (choice === round.answer) {
      setResults((current) =>
        current.map((value, index) =>
          index === roundIndex
            ? {
                attempts: nextAttemptCount,
                firstTry: nextAttemptCount === 1,
              }
            : value,
        ),
      );
      if (soundOn) playSuccessSound();
    }
  };

  const moveToRound = (nextIndex: number) => {
    setRoundIndex(nextIndex);
    document
      .getElementById("toffee-question")
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const resetGame = () => {
    const shouldReset = window.confirm(
      "क्या टॉफ़ी खेल के सभी जवाब और शिक्षक झलक मिटाकर फिर से शुरू करें?",
    );
    if (!shouldReset) return;
    setRoundIndex(0);
    setAttempts(Array.from({ length: rounds.length }, () => 0));
    setLastChoices(Array.from({ length: rounds.length }, () => null));
    setResults(Array.from({ length: rounds.length }, () => null));
    setTeacherPanelOpen(false);
  };

  return (
    <section className="toffee-page" aria-labelledby="toffee-title">
      <div className="toffee-hero">
        <div>
          <p className="eyebrow eyebrow--toffee">
            <span aria-hidden="true">🍬</span> बोलो · सोचो · खेलो
          </p>
          <h1 id="toffee-title">टॉफ़ी का खेल</h1>
          <p>
            सवाल सुनिए, दोस्तों से बात कीजिए और सही टॉफ़ी डिब्बा चुनिए!
          </p>
        </div>
        <div className="toffee-hero__mascot" aria-hidden="true">
          <span>🍬</span>
          <strong>हिसाब में<br />मिठास!</strong>
        </div>
      </div>

      <div className="teacher-tip" role="note">
        <span className="teacher-tip__icon" aria-hidden="true">💡</span>
        <div>
          <strong>कैसे खेलें?</strong>
          <p>
            बच्चे जवाब ज़ोर से बोलें। आप उनके जवाब वाला बटन दबाएँ—गलत जवाब पर
            भी खेल प्यार से एक और मौका देगा।
          </p>
        </div>
        <button
          type="button"
          className="teacher-tip__button"
          onClick={() => setTeacherPanelOpen((open) => !open)}
          aria-expanded={teacherPanelOpen}
          aria-controls="teacher-baseline"
        >
          {teacherPanelOpen ? "झलक छिपाएँ" : "शिक्षक झलक"}
        </button>
      </div>

      <div className="round-trail" aria-label="सवाल चुनें">
        {rounds.map((item, index) => {
          const itemResult = results[index];
          return (
            <button
              type="button"
              key={item.id}
              className={`round-dot ${
                index === roundIndex ? "is-current" : ""
              } ${itemResult ? "is-complete" : ""}`}
              onClick={() => moveToRound(index)}
              aria-current={index === roundIndex ? "step" : undefined}
              aria-label={`सवाल ${item.id}: ${item.skill}${
                itemResult ? ", पूरा हुआ" : ""
              }`}
            >
              <span>{itemResult ? "✓" : item.id}</span>
              <small>{item.level}</small>
            </button>
          );
        })}
      </div>

      <article className="toffee-board" id="toffee-question">
        <div className="toffee-board__top">
          <div className="round-label">
            <span>सवाल {round.id} / {rounds.length}</span>
            <strong>{round.skill}</strong>
          </div>
          <div className={`level-pill level-pill--${round.level}`}>
            {round.level === "गरमजोशी" && "🌱"}
            {round.level === "थोड़ा सोचो" && "🌟"}
            {round.level === "सुपर चुनौती" && "🚀"} {round.level}
          </div>
        </div>

        <div className="story-stage">
          <div className="story-character">
            <span className="story-character__face" aria-hidden="true">
              {round.childEmoji}
            </span>
            <strong>{round.child}</strong>
            {round.visual === "change" && (
              <div className="candy-basket">
                <span className="candy-basket__count">{round.start}</span>
                <CandyPieces count={round.start} />
              </div>
            )}
          </div>

          <div className="story-action">
            <div className="story-action__math" aria-label="हिसाब">
              <span>{round.start}</span>
              <b>{round.operator}</b>
              <span>{round.change}</span>
              <b>=</b>
              <span className="mystery-number">?</span>
            </div>
            <p>{round.action}</p>
            {round.visual === "change" && (
              <div className="change-candies">
                <span>{round.operator === "+" ? "मिलीं" : "दीं"}</span>
                <CandyPieces
                  count={round.change}
                  muted={round.operator === "−"}
                />
              </div>
            )}
            {round.visual === "groups" && (
              <CandyGroups
                groups={round.groups ?? 0}
                perGroup={round.perGroup ?? 0}
                label={`${round.groups} पुड़ियों में ${round.perGroup}-${round.perGroup} टॉफ़ियाँ`}
              />
            )}
            {round.visual === "share" && (
              <CandyGroups
                groups={round.groups ?? 0}
                perGroup={round.perGroup ?? 0}
                label={`${round.start} टॉफ़ियाँ ${round.groups} बराबर हिस्सों में`}
              />
            )}
          </div>

          <div className="story-character story-character--friend">
            <span className="story-character__face" aria-hidden="true">
              {round.friendEmoji}
            </span>
            <strong>{round.friend}</strong>
            <span className="speech-bubble">
              {round.operator === "+"
                ? "ये लो!"
                : round.operator === "−"
                  ? "एक टॉफ़ी मिलेगी?"
                  : round.operator === "×"
                    ? "हर पुड़िया बराबर!"
                    : "सबको बराबर!"}
            </span>
          </div>
        </div>

        <div className="answer-zone">
          <p className="answer-zone__callout">सब मिलकर बोलो! 📣</p>
          <h2>{round.question}</h2>
          <div className="answer-choices" aria-label="जवाब चुनें">
            {round.choices.map((choice) => {
              const isSelected = choice === selectedChoice;
              const isCorrect = Boolean(result) && choice === round.answer;
              const isWrong = isSelected && !result && choice !== round.answer;

              return (
                <button
                  type="button"
                  key={choice}
                  className={`answer-choice ${
                    isCorrect ? "is-correct" : ""
                  } ${isWrong ? "is-wrong" : ""}`}
                  onClick={() => chooseAnswer(choice)}
                  disabled={Boolean(result)}
                  aria-label={`${choice} टॉफ़ियाँ`}
                >
                  <span>{choice}</span>
                  <small>टॉफ़ियाँ</small>
                  {isCorrect && <b aria-hidden="true">✓</b>}
                </button>
              );
            })}
          </div>

          <div className="answer-feedback" aria-live="polite">
            {result ? (
              <div className="answer-feedback__success">
                <span aria-hidden="true">🎉</span>
                <div>
                  <strong>
                    {result.firstTry
                      ? "बिल्कुल सही—पहली कोशिश में!"
                      : "शानदार! मिलकर जवाब मिल गया।"}
                  </strong>
                  <p>
                    {round.start} {round.operator} {round.change} ={" "}
                    <b>{round.answer}</b>
                  </p>
                </div>
              </div>
            ) : selectedChoice !== null ? (
              <div className="answer-feedback__retry">
                <span aria-hidden="true">🤔</span>
                <div>
                  <strong>अच्छी कोशिश—एक बार फिर सोचें!</strong>
                  <p>टॉफ़ियों को छूकर गिनें या किसी दोस्त की मदद लें।</p>
                </div>
              </div>
            ) : (
              <p className="answer-feedback__waiting">
                बच्चों का जवाब सुनकर ऊपर का एक डिब्बा चुनें।
              </p>
            )}
          </div>

          {result && (
            <div className="round-actions">
              {roundIndex < rounds.length - 1 ? (
                <button
                  type="button"
                  className="next-round-button"
                  onClick={() => moveToRound(roundIndex + 1)}
                >
                  अगला सवाल <span aria-hidden="true">→</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="next-round-button"
                  onClick={() => setTeacherPanelOpen(true)}
                >
                  खेल की झलक देखें <span aria-hidden="true">🏆</span>
                </button>
              )}
            </div>
          )}
        </div>
      </article>

      <section
        className={`baseline-panel ${teacherPanelOpen ? "is-open" : ""}`}
        id="teacher-baseline"
        aria-hidden={!teacherPanelOpen}
        hidden={!teacherPanelOpen}
      >
        <div className="baseline-panel__heading">
          <div>
            <p>केवल शिक्षक के लिए</p>
            <h2>आज की छोटी-सी झलक</h2>
          </div>
          <button
            type="button"
            onClick={() => setTeacherPanelOpen(false)}
            aria-label="शिक्षक झलक बंद करें"
          >
            ×
          </button>
        </div>

        <div className="baseline-score">
          <div>
            <strong>{completedRounds}</strong>
            <span>/ {rounds.length}</span>
            <small>सवाल पूरे</small>
          </div>
          <div>
            <strong>{firstTryRounds}</strong>
            <span>/ {completedRounds || "—"}</span>
            <small>पहली कोशिश में</small>
          </div>
        </div>

        <div className="skill-summary">
          {skillSummary.map((item) => (
            <article key={item.skill}>
              <div>
                <strong>{item.skill}</strong>
                <span>{item.completed} / {item.total} सवाल पूरे</span>
              </div>
              <span
                className={`skill-signal ${
                  item.completed === 0
                    ? ""
                    : item.firstTry === item.total
                      ? "skill-signal--strong"
                      : "skill-signal--support"
                }`}
              >
                {item.completed === 0
                  ? "अभी बाकी"
                  : item.firstTry === item.total
                    ? "बिना मदद"
                    : `${item.completed - item.firstTry} में मदद`}
              </span>
            </article>
          ))}
        </div>

        <div className="round-summary" aria-label="हर सवाल का परिणाम">
          {rounds.map((item, index) => (
            <span
              key={item.id}
              className={
                results[index]
                  ? results[index]?.firstTry
                    ? "is-first-try"
                    : "is-with-help"
                  : ""
              }
              title={`सवाल ${item.id}: ${item.skill}`}
            >
              {results[index]
                ? results[index]?.firstTry
                  ? "✓"
                  : "🤝"
                : item.id}
            </span>
          ))}
        </div>

        <p className="baseline-note">
          <span aria-hidden="true">📝</span>
          यह पूरी कक्षा की शुरुआती प्रतिक्रिया का संकेत है—औपचारिक परीक्षा या
          किसी एक बच्चे का परिणाम नहीं।
        </p>

        <button className="reset-game-button" type="button" onClick={resetGame}>
          <span aria-hidden="true">↺</span> पूरा खेल फिर से शुरू करें
        </button>
      </section>
    </section>
  );
}
