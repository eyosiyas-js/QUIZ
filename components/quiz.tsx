"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { Canvas } from "@react-three/fiber";
import QuestionScene from "./question-scene";
import ProgressBar from "./progress-bar";
import CelebrationScreen from "./celebration-screen";
import Timer from "./timer";
import { Button } from "@/components/ui/button";
import { AlertCircle, Sparkles } from "lucide-react";
import { useQuizContext, type AnsweredQuestion } from "@/context/quiz-context";
import { useSiteConfig } from "@/context/site-config-context";
import { useMobile } from "@/hooks/use-mobile";
import { useRouter } from "next/navigation";

// Utility function to determine text size based on content length
const getTextSizeClass = (text: string, type: "question" | "answer") => {
  const length = text.length;

  if (type === "question") {
    if (length > 150) return "text-lg sm:text-xl md:text-2xl";
    if (length > 100) return "text-xl sm:text-2xl md:text-2xl";
    return "text-xl sm:text-2xl md:text-3xl";
  } else {
    if (length > 100) return "text-sm sm:text-base";
    if (length > 70) return "text-base sm:text-lg";
    return "text-base sm:text-lg";
  }
};

export default function Quiz() {
  const { setQuizResults, setQuizCompleted } = useQuizContext();
  const { config } = useSiteConfig();
  const [quizData, setQuizData] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [direction, setDirection] = useState(1);
  const [isRotating, setIsRotating] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [errorData, setErrorData] = useState("");
  const [answeredQuestions, setAnsweredQuestions] = useState<
    AnsweredQuestion[]
  >([]);
  const [questionStartTime, setQuestionStartTime] = useState<number>(
    Date.now()
  );
  const [timerActive, setTimerActive] = useState(true);
  const isMobile = useMobile();
  const router = useRouter();

  // Config values
  const quizConfig = config?.pages?.quiz;
  const theme = config?.theme;
  const btnFrom = theme?.buttonGradientFrom || "#0284c7";
  const btnTo = theme?.buttonGradientTo || "#2563eb";
  const selectedColor = theme?.selectedAnswerColor || "#9333ea";
  const timerDuration = quizConfig?.timerDuration || 60;

  useEffect(() => {
    const fetchQuizData = async () => {
      try {
        const response = await api.get('/quiz');

        const formattedData = response.data.map((item: any) => ({
          id: item.id,
          question: item.question,
          options: item.options,
        }));

        setQuizData(formattedData);
      } catch (error: any) {
        console.error("error:", error.response?.data?.error || error);
        setErrorData(error.response?.data?.error || "Failed to load quiz");
        setShowError(true);
      }
    };

    fetchQuizData();
  }, []);

  useEffect(() => {
    setQuestionStartTime(Date.now());
    setTimerActive(true);
  }, [currentQuestionIndex]);

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
  };

  const handleTimeUp = () => {
    handleNextQuestion();
  };
  const [showError, setShowError] = useState(false);

  const handleNextQuestion = async () => {
    const timeSpent = Math.round((Date.now() - questionStartTime) / 1000);
    const currentQuestion = quizData[currentQuestionIndex];

    const updatedAnsweredQuestions = [
      ...answeredQuestions,
      {
        questionId: currentQuestion.id,
        question: currentQuestion.question,
        userAnswer: selectedAnswer,
        correctAnswer: null, // placeholder until we get it from API
        isCorrect: false, // placeholder
        timeSpent,
      },
    ];

    setAnsweredQuestions(updatedAnsweredQuestions);
    setTimerActive(false);

    if (currentQuestionIndex >= quizData.length - 1) {
      try {
        const payload = {
          answers: updatedAnsweredQuestions.map((q) => ({
            question_id: q.questionId,
            selected_answer: q.userAnswer,
          })),
        };

        const response = await api.post('/quiz', payload);

        const { corrections, score: scoreStr } = response.data;
        const [scoreValue] = scoreStr.split("/").map(Number);
        setScore(scoreValue);
        const finalAnswered = corrections.map((item: any) => ({
          questionId: item.question_id,
          question: item.the_question,
          userAnswer: item.answer,
          correctAnswer: item.correct_answer,
          isCorrect: item.correct,
          timeSpent:
            updatedAnsweredQuestions.find(
              (q) => q.questionId === item.question_id
            )?.timeSpent || 0,
        }));

        console.log(finalAnswered);
        setQuizResults({
          score: scoreValue,
          totalQuestions: quizData.length,
          answeredQuestions: finalAnswered,
        });

        localStorage.setItem("quizCompleted", "true");
        setQuizCompleted(true);
        setShowCelebration(true);
      } catch (error) {
        console.error("Error submitting quiz:", error);
        router.push("/contest");
      }

      return;
    }

    setIsRotating(true);
    setDirection(1);
    setRotation(rotation + 90);

    setTimeout(() => {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setIsRotating(false);
    }, 800);
  };

  if (quizData.length === 0 && showError == false) {
    return <div className="text-center text-white">{quizConfig?.loadingText || "Loading quiz..."}</div>;
  }

  if (showError) {
    return <AnimatePresence>
        {showError && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="fixed  transform -translate-x-1/2 z-50 max-w-md w-full"
          >
            <div className="bg-red-950/95 backdrop-blur-md border border-red-500/50 rounded-lg p-4 shadow-2xl shadow-red-500/20">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-white font-semibold text-sm mb-1"> Not Available</h4>
                  <p className="text-white/80 text-xs mb-3">
                    {errorData}
                  </p>
                  <Button 
                    onClick={() => router.push("/contest")}
                    className="w-full bg-red-600 hover:bg-red-700 text-white text-xs py-1 h-8"
                  >
                    Back to Contest
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
  }

  const currentQuestion = quizData[currentQuestionIndex];
  const progress = (currentQuestionIndex / quizData.length) * 100;
  const questionTextClass = getTextSizeClass(
    currentQuestion.question,
    "question"
  );

  return (
    <div className="w-full max-w-4xl">
      <AnimatePresence mode="wait">
        {showCelebration ? (
          <motion.div
            key="celebration"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <CelebrationScreen score={score} totalQuestions={quizData.length} />
          </motion.div>
        ) : (
          <motion.div
            key="quiz"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center"
          >
            <div className="w-full mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="w-full sm:w-2/3 mb-2 sm:mb-0">
                <ProgressBar progress={progress} />
              </div>
              <div className="w-full sm:w-1/3">
                <Timer
                  duration={timerDuration}
                  onTimeUp={handleTimeUp}
                  isActive={timerActive}
                />
              </div>
            </div>

            <div
              className={`w-full ${
                isMobile ? "h-[400px]" : "h-[450px]"
              } relative mb-6 rounded-2xl overflow-hidden shadow-2xl`}
            >
              <Canvas className="absolute inset-0">
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} />
                <QuestionScene
                  isRotating={isRotating}
                  direction={direction}
                  rotation={rotation}
                  question={currentQuestion.question}
                />
              </Canvas>

              <div className="absolute inset-0 z-10 flex flex-col justify-start items-center pointer-events-none">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="text-center p-4 sm:p-6 w-full pointer-events-auto flex flex-col h-full"
                >
                  <div className="flex-shrink-0 mb-4 sm:mb-6">
                    <h2
                      className={`${questionTextClass} font-bold text-white text-center drop-shadow-lg max-w-[95%] mx-auto`}
                    >
                      {currentQuestion.question}
                    </h2>
                  </div>

                  <div className="flex-grow overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-1 gap-3 w-full max-w-2xl mx-auto px-2 sm:px-4 pb-2">
                      {currentQuestion.options.map(
                        (option: string, index: number) => {
                          const answerTextClass = getTextSizeClass(
                            option,
                            "answer"
                          );
                          return (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{
                                delay: 0.4 + index * 0.1,
                                duration: 0.5,
                              }}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <button
                                onClick={() => handleAnswerSelect(option)}
                                className={`w-full p-3 sm:p-4 rounded-xl ${answerTextClass} font-medium transition-all duration-300 text-left ${
                                  selectedAnswer === option
                                    ? "text-white shadow-lg"
                                    : "bg-white/10 text-white backdrop-blur-md hover:bg-white/20"
                                }`}
                                style={
                                  selectedAnswer === option
                                    ? { backgroundColor: selectedColor, boxShadow: `0 10px 15px -3px ${selectedColor}80` }
                                    : undefined
                                }
                              >
                                {option}
                              </button>
                            </motion.div>
                          );
                        }
                      )}
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="w-full px-4 flex justify-center"
            >
              <Button
                onClick={handleNextQuestion}
                disabled={!selectedAnswer}
                size={isMobile ? "default" : "lg"}
                className={`${
                  isMobile ? "px-4 py-2 text-base" : "px-8 py-6 text-lg"
                } shadow-lg shadow-blue-500/30 transition-all duration-300 disabled:opacity-50 w-full sm:w-auto`}
                style={{
                  background: `linear-gradient(to right, ${btnFrom}, ${btnTo})`,
                }}
              >
                {currentQuestionIndex < quizData.length - 1 ? (
                  <>
                    {quizConfig?.nextButtonText || "Next Question"}{" "}
                    <Sparkles className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                  </>
                ) : (
                  <>
                    {quizConfig?.finishButtonText || "Finish Quiz"}{" "}
                    <Sparkles className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                  </>
                )}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}