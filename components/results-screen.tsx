"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Trophy,
  RotateCcw,
  Clock,
  CheckCircle,
  XCircle,
  User,
} from "lucide-react";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AnsweredQuestion } from "@/context/quiz-context";
import { useSiteConfig } from "@/context/site-config-context";
import { useMobile } from "@/hooks/use-mobile";
import RatingModal from "./rating-modal";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

// Utility function to determine text size based on content length
const getTextSizeClass = (text: string, type: "question" | "answer") => {
  const length = text.length;

  if (type === "question") {
    if (length > 150) return "text-xs sm:text-sm";
    if (length > 100) return "text-sm sm:text-base";
    return "text-sm sm:text-base";
  } else {
    // answer
    if (length > 100) return "text-xs sm:text-sm";
    if (length > 70) return "text-xs sm:text-sm";
    return "text-xs sm:text-sm";
  }
};

interface ResultsScreenProps {
  score: number;
  totalQuestions: number;
  answeredQuestions: AnsweredQuestion[];
  onRestart: () => void;
  userName: string;
}

export default function ResultsScreen({
  score,
  totalQuestions,
  answeredQuestions,
  onRestart,
  userName,
}: ResultsScreenProps) {
  const { config } = useSiteConfig();
  const percentage = Math.round((score / totalQuestions) * 100);
  const [activeTab, setActiveTab] = useState("summary");
  const isMobile = useMobile();
  const isPerfectScore = score === totalQuestions;
  const [showRatingModal, setShowRatingModal] = useState(false);
  const router = useRouter();

  // Config values
  const resultsConfig = config?.pages?.results;
  const theme = config?.theme;
  const sections = config?.sections;
  const gradientFrom = theme?.primaryGradientFrom || "#0b1236";
  const gradientVia = theme?.primaryGradientVia || "#0f1a4a";
  const gradientTo = theme?.primaryGradientTo || "#091029";
  const btnFrom = theme?.buttonGradientFrom || "#0284c7";
  const btnTo = theme?.buttonGradientTo || "#2563eb";

  const messages = resultsConfig?.messages || {};

  // Calculate total time spent
  const totalTimeSpent = answeredQuestions.reduce(
    (total, q) => total + (q.timeSpent || 0),
    0
  );

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handleTryAgainClick = () => {
    const rt = localStorage.getItem("quizRatings");
    if (rt || sections?.showRatingModal === false) {
      router.push("/contest");
    } else {
      setShowRatingModal(true);
    }
  };

  const getScoreMessage = () => {
    if (percentage >= 90) {
      return isPerfectScore
        ? (messages.perfect || "Perfect score! You've earned maximum contest entries!")
        : (messages.excellent || "Excellent! Nearly perfect score!");
    }
    if (percentage >= 70) return messages.great || "Great job! You did well!";
    if (percentage >= 50) return messages.good || "Good effort! Keep practicing!";
    return messages.low || "Keep trying! You'll do better next time!";
  };

  const handleRatingSubmit = async (rating: number, comment?: string) => {
    setShowRatingModal(false);

    if (rating > 0) {
      const ratings = JSON.parse(localStorage.getItem("quizRatings") || "[]");
      console.log(ratings);
      ratings.push({
        rating,
        date: new Date().toISOString(),
        userName,
        score,
        totalQuestions,
      });
      localStorage.setItem("quizRatings", JSON.stringify(ratings));
      console.log(rating, comment);
    }
    const token = localStorage.getItem("auth_token");

    const payload = {
      feedback: {
        stars: rating,
        comment: comment || "",
      },
    };
    const response = await api
      .post(`/feedback`, payload)
      .then((res) => {
        router.push("/contest");
      });

    setTimeout(() => {
      onRestart();
    }, 500);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full flex flex-col items-center"
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-4 sm:mb-6 flex items-center"
        >
          <User className="h-4 w-4 sm:h-5 sm:w-5 text-white/80 mr-2" />
          <span className="text-white/80 text-sm sm:text-base">
            Results for:{" "}
          </span>
          <span className="text-white font-medium ml-1 text-sm sm:text-base">
            {userName}
          </span>
        </motion.div>

        <Tabs
          defaultValue="summary"
          className="w-full"
          onValueChange={setActiveTab}
        >
          <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-6">
            <TabsTrigger value="summary">{resultsConfig?.summaryTabLabel || "Summary"}</TabsTrigger>
            <TabsTrigger value="details">{resultsConfig?.detailsTabLabel || "Question Details"}</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="w-full">
            <div
              className={`w-full ${
                isMobile ? "h-[350px]" : "h-[450px]"
              } relative mb-6 sm:mb-8 rounded-2xl overflow-hidden shadow-2xl`}
              style={{
                background: `linear-gradient(to bottom right, ${gradientFrom}, ${gradientVia}, ${gradientTo})`,
              }}
            >
              <div className="absolute inset-0 z-10 flex flex-col justify-center items-center p-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                  className="text-center"
                >
                  <h2 className="text-2xl sm:text-4xl font-bold text-white mb-2 sm:mb-4 drop-shadow-lg flex items-center justify-center">
                    <Trophy className="mr-2 h-6 w-6 sm:h-8 sm:w-8 text-yellow-400" />{" "}
                    {resultsConfig?.scoreTitle || "Your Score"}
                  </h2>
                  <div className="text-4xl sm:text-7xl font-bold mb-4 sm:mb-6 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-300">
                    {score}/{totalQuestions}
                  </div>

                  <div className="flex flex-col sm:flex-row justify-center items-center sm:space-x-4 space-y-2 sm:space-y-0 mb-4 sm:mb-6">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-white/80 mr-2" />
                      <span className="text-white/80 text-sm sm:text-base">
                        Total time: {formatTime(totalTimeSpent)}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mr-2" />
                      <span className="text-white/80 text-sm sm:text-base">
                        Correct: {score}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 mr-2" />
                      <span className="text-white/80 text-sm sm:text-base">
                        Incorrect: {totalQuestions - score}
                      </span>
                    </div>
                  </div>

                  <p className="text-base sm:text-xl text-white/80 mb-4">
                    {getScoreMessage()}
                  </p>

                  {/* Trophy for good scores */}
                  {percentage >= 70 && (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.8, duration: 0.8, type: "spring" }}
                      className="mt-4 sm:mt-8"
                    >
                      <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto bg-gradient-to-br from-yellow-400 to-amber-600 rounded-full flex items-center justify-center">
                        <Trophy className="h-8 w-8 sm:h-12 sm:w-12 text-white" />
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              </div>

              {/* Tech-themed background elements */}
              <div className="absolute inset-0 overflow-hidden">
                {Array.from({ length: 20 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute rounded-full bg-blue-500/30"
                    style={{
                      width: Math.random() * 10 + 5,
                      height: Math.random() * 10 + 5,
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                    }}
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{
                      duration: 2 + Math.random() * 2,
                      repeat: Number.POSITIVE_INFINITY,
                      repeatType: "reverse",
                      delay: Math.random() * 2,
                    }}
                  />
                ))}

                {/* Circuit lines */}
                {Array.from({ length: 8 }).map((_, i) => (
                  <motion.div
                    key={`line-${i}`}
                    className="absolute bg-cyan-500/20"
                    style={{
                      height: 1,
                      width: 100 + Math.random() * 200,
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      transform: `rotate(${Math.random() * 180}deg)`,
                    }}
                    animate={{
                      opacity: [0.1, 0.3, 0.1],
                    }}
                    transition={{
                      duration: 3 + Math.random() * 2,
                      repeat: Number.POSITIVE_INFINITY,
                      repeatType: "reverse",
                      delay: Math.random() * 2,
                    }}
                  />
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="details" className="w-full">
            <div className="w-full mb-6 sm:mb-8">
              <Card className="bg-white/5 backdrop-blur-md border-white/10">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-white text-lg sm:text-xl">
                    {resultsConfig?.detailsTabLabel || "Question Details"}
                  </CardTitle>
                  <CardDescription className="text-white/70 text-sm sm:text-base">
                    Review your answers and see where you went right or wrong
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                  <div className="space-y-4 sm:space-y-6 max-h-[350px] sm:max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {answeredQuestions.map((q, index) => {
                      const questionTextClass = getTextSizeClass(
                        q.question,
                        "question"
                      );
                      const answerTextClass = q.userAnswer
                        ? getTextSizeClass(q.userAnswer, "answer")
                        : "";

                      return (
                        <motion.div
                          key={q.questionId}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1, duration: 0.5 }}
                          className={`p-3 sm:p-4 rounded-lg ${
                            q.isCorrect
                              ? "bg-green-900/20 border border-green-500/30"
                              : "bg-red-900/20 border border-red-500/30"
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 gap-2">
                            <h3 className="text-base sm:text-lg font-medium text-white flex items-center">
                              {q.isCorrect ? (
                                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mr-2 flex-shrink-0" />
                              ) : (
                                <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 mr-2 flex-shrink-0" />
                              )}
                              Question {index + 1}
                            </h3>
                            <Badge
                              variant={q.isCorrect ? "default" : "destructive"}
                              className="self-start sm:self-auto"
                            >
                              {q.isCorrect ? "Correct" : "Incorrect"}
                            </Badge>
                          </div>

                          <p
                            className={`text-white/90 mb-3 ${questionTextClass} break-words`}
                          >
                            {q.question}
                          </p>

                          <div className="grid grid-cols-1 gap-2 text-xs sm:text-sm">
                            <div className="flex flex-col sm:flex-row sm:items-start">
                              <span className="text-white/70 w-full sm:w-32 flex-shrink-0 mb-1 sm:mb-0">
                                Your answer:
                              </span>
                              <span
                                className={`${
                                  q.isCorrect
                                    ? "text-green-400"
                                    : "text-red-400"
                                } break-words ${answerTextClass}`}
                              >
                                {q.userAnswer || "No answer provided"}
                              </span>
                            </div>

                            {!q.isCorrect && (
                              <div className="flex flex-col sm:flex-row sm:items-start">
                                <span className="text-white/70 w-full sm:w-32 flex-shrink-0 mb-1 sm:mb-0">
                                  Correct answer:
                                </span>
                                <span
                                  className={`text-green-400 break-words ${getTextSizeClass(
                                    q.correctAnswer,
                                    "answer"
                                  )}`}
                                >
                                  {q.correctAnswer}
                                </span>
                              </div>
                            )}

                            <div className="flex flex-col sm:flex-row sm:items-start">
                              <span className="text-white/70 w-full sm:w-32 flex-shrink-0 mb-1 sm:mb-0">
                                Time spent:
                              </span>
                              <span className="text-white/90">
                                {formatTime(q.timeSpent || 0)}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="w-full flex justify-center px-4"
        >
          <Button
            onClick={handleTryAgainClick}
            size={isMobile ? "default" : "lg"}
            className={`${
              isMobile ? "px-4 py-2 text-base" : "px-8 py-6 text-lg"
            } shadow-lg shadow-blue-500/30 transition-all duration-300 w-full sm:w-auto`}
            style={{
              background: `linear-gradient(to right, ${btnFrom}, ${btnTo})`,
            }}
          >
            {resultsConfig?.backButtonText || "Back"}
          </Button>
        </motion.div>
      </motion.div>
      {/* Rating Modal */}
      <RatingModal
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        onSubmit={handleRatingSubmit}
        userName={userName}
      />
    </>
  );
}
