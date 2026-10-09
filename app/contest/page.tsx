"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useQuizContext } from "@/context/quiz-context";
import { useSiteConfig } from "@/context/site-config-context";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Gift,
  Trophy,
  ChevronRight,
  Ticket,
  Award,
  Users,
  CheckCircle,
  Star,
  Gamepad2,
  Zap,
} from "lucide-react";
import { useMobile } from "@/hooks/use-mobile";
import UserInfoDisplay from "@/components/user-info-display";
import axios from "axios";
import Image from "next/image";

export default function ContestPage() {
  const { isLoggedIn, userInfo, quizCompleted, setQuizCompleted } =
    useQuizContext();
  const { config } = useSiteConfig();
  const router = useRouter();
  const isMobile = useMobile();
  const [isAdmin, setIsAdmin] = useState(false);

  // Config values with fallbacks
  const pageConfig = config?.pages?.contest;
  const theme = config?.theme;
  const media = config?.media;
  const sections = config?.sections;
  const branding = config?.branding;
  const prizes = config?.prizes || [];

  const gradientFrom = theme?.primaryGradientFrom || "#0b1236";
  const gradientVia = theme?.primaryGradientVia || "#0f1a4a";
  const gradientTo = theme?.primaryGradientTo || "#091029";
  const btnFrom = theme?.buttonGradientFrom || "#0284c7";
  const btnTo = theme?.buttonGradientTo || "#2563eb";
  const overlayOpacity = theme?.overlayOpacity ?? 0.6;

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) return;
    axios
      .post(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/verify`,
        {},
        {
          headers: {
            Authorization: token,
          },
        }
      )
      .then((res) => {
        setIsAdmin(true);
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

  useEffect(() => {
    // If not logged in, redirect to login
    if (!isLoggedIn) {
      router.push("/login");
    }

  }, [isLoggedIn, router, setQuizCompleted]);

  const handleStartQuiz = () => {
    router.push("/");
  };
  const handleStartGame = () => {
    const token = localStorage.getItem("Dtoken");

    if (token) {
      window.location.href = `https://lottery.insa.gov.et/datadefender/game/${token}`;
    } else {
      console.warn("Token not found. Please log in first.");
    }
  };

  const handleViewLottery = () => {
    router.push("/lottery");
  };

  const handleViewWinners = () => {
    router.push("/score");
  };
  const handleViewResults = () => {
    router.push("/");
  };

  if (!isLoggedIn || !userInfo) {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center p-4"
        style={{
          background: `linear-gradient(to bottom right, ${gradientFrom}, ${gradientVia}, ${gradientTo})`,
        }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-20 h-20 border-t-4 border-blue-500 border-solid rounded-full animate-spin"
        />
        <p className="mt-4 text-white text-xl">Loading...</p>
      </div>
    );
  }

  // Build success message with name interpolation
  const successMessage = (pageConfig?.successMessage || "Congratulations {name}, you're now entered in our contest!")
    .replace("{name}", userInfo.name);

  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center p-4 relative"
      style={{
        background: `linear-gradient(to bottom right, ${gradientFrom}, ${gradientVia}, ${gradientTo})`,
      }}
    >
      {/* Background Video */}
      {media?.backgroundType === "video" && sections?.showBackgroundVideo !== false && (
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute top-0 left-0 w-full h-[100vh] object-cover blur-sm scale-105 z-0"
        >
          <source src={media?.backgroundVideoUrl || "/cyber.mp4"} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      )}

      {media?.backgroundType === "image" && media?.backgroundImageUrl && (
        <div
          className="absolute top-0 left-0 w-full h-[100vh] bg-cover bg-center blur-sm scale-105 z-0"
          style={{ backgroundImage: `url(${media.backgroundImageUrl})` }}
        />
      )}

      {/* Gradient Overlay */}
      <div
        className="absolute top-0 left-0 w-full h-[120vh] z-10"
        style={{
          background: `linear-gradient(to bottom right, ${gradientFrom}, ${gradientVia}, ${gradientTo})`,
          opacity: overlayOpacity,
        }}
      />

      <div className=" z-30">
        <UserInfoDisplay />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl relative z-20 "
      >
        {/* Success Card */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20 mb-6 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-40 h-40 -mr-10 -mt-10 bg-gradient-to-br from-green-500/20 to-cyan-500/20 rounded-full blur-2xl" />
          <CardHeader className="p-6 text-center relative z-10">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{
                duration: 0.5,
                repeat: 1,
                repeatType: "reverse",
                repeatDelay: 1,
              }}
              className="mx-auto mb-4"
            >
              {sections?.showLogo !== false && branding?.logoUrl && (
                <img className="h-20" src={branding.logoUrl} alt={branding?.organizationName || "Logo"} />
              )}
            </motion.div>
            <CardTitle className="text-2xl sm:text-3xl font-bold text-white mb-2">
              {pageConfig?.successTitle || "Registration Successful!"}
            </CardTitle>
            <CardDescription className="text-white/70 text-base sm:text-lg">
              {successMessage}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-0 text-center relative z-10">
            <p className="text-white/80 mb-4">
              {pageConfig?.phoneConfirmText || "Your entry has been confirmed with phone number:"}{" "}
              <span className="font-medium text-white">{userInfo.phone}</span>
            </p>

            {/* Added button to view lottery */}
            {isAdmin && sections?.showLottery !== false ? (
              <Button
                onClick={handleViewLottery}
                className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white mt-2"
              >
                <Users className="mr-2 h-4 w-4" /> {pageConfig?.viewLotteryText || "View Lottery Drawing"}
              </Button>
            ) : (
              <Button
                onClick={handleViewWinners}
                className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white mt-2"
              >
                <Users className="mr-2 h-4 w-4" /> {pageConfig?.viewWinnersText || "View Winners"}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Quiz Card */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-40 h-40 -ml-10 -mt-10 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full blur-2xl" />
          <CardHeader className="p-6 relative z-10">
            <div className="flex items-center mb-2">
              <Award className="h-6 w-6 text-yellow-400 mr-2" />
              <CardTitle className="text-xl sm:text-2xl font-bold text-white">
                {pageConfig?.quizSectionTitle || "Cyber Security Quiz Challenge"}
              </CardTitle>
            </div>
            <CardDescription className="text-white/70 text-base">
              {pageConfig?.quizSectionSubtitle || "Take our Cyber Security Quiz to win Prizes in the contest!"}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-0 relative z-10">
            <div className="flex flex-col sm:flex-row items-center justify-between bg-white/5 rounded-lg p-4 backdrop-blur-sm">
              <div className="w-full space-y-4">
                <div className="flex items-center mb-2">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                    <Trophy className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-medium text-white">
                      {pageConfig?.quizInfoTitle || "Cyber Security Quiz Challenge"}
                    </h3>
                    <p className="text-white/70 text-sm">
                      {pageConfig?.quizInfoSubtitle || "10 questions • ~10 minutes"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center mb-3">
                  <Gift className="h-5 w-5 text-green-400 mr-2" />
                  <span className="text-white/80 text-sm">
                    {pageConfig?.quizCompletionBonus || "+3 extra Prizes for completion!"}
                  </span>
                </div>

                {/* Prizes */}
                {sections?.showPrizes !== false && prizes.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {prizes.map((prize, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1, duration: 0.5 }}
                        className="group"
                      >
                        <div className="bg-white/5 backdrop-blur-sm rounded-lg overflow-hidden border border-white/10 hover:border-cyan-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-400/20">
                          {/* Prize Image */}
                          <div className="relative h-32 bg-gradient-to-br from-blue-900/20 to-cyan-900/20 overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                            <Image
                              src={prize.image || "/placeholder.svg"}
                              alt={prize.name}
                              fill
                              className="object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            {/* Value Badge */}
                            <div className="absolute top-2 right-2 bg-yellow-500/90 backdrop-blur-sm px-2 py-1 rounded-full z-20">
                              <span className="text-xs font-bold text-gray-900">
                                {prize.rank}
                              </span>
                            </div>
                          </div>

                          {/* Prize Info */}
                          <div className="p-3">
                            <h5 className="text-white font-semibold text-sm mb-1">
                              {prize.name}
                            </h5>
                            <p className="text-white/60 text-xs line-clamp-2">
                              {prize.description}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="p-6 pt-0 flex justify-center sm:justify-end relative z-10">
            {quizCompleted ? (
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <div className="bg-green-500/20 text-green-400 px-4 py-2 rounded-lg flex items-center justify-center mb-3 sm:mb-0 w-full sm:w-auto">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  <span>{pageConfig?.quizCompletedText || "Quiz Completed"}</span>
                </div>
                <Button
                  onClick={handleViewResults}
                  size={isMobile ? "default" : "lg"}
                  className={`${
                    isMobile ? "px-4 py-2 text-base" : "px-8 py-6 text-lg"
                  } shadow-lg shadow-blue-500/30 transition-all duration-300 w-full sm:w-auto`}
                  style={{
                    background: `linear-gradient(to right, ${btnFrom}, ${btnTo})`,
                  }}
                >
                  {pageConfig?.tryNextRoundText || "Try Next Round"}{" "}
                  <ChevronRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </div>
            ) : (
              <Button
                onClick={handleStartQuiz}
                size={isMobile ? "default" : "lg"}
                className={`${
                  isMobile ? "px-4 py-2 text-base" : "px-8 py-6 text-lg"
                } shadow-lg shadow-blue-500/30 transition-all duration-300 w-full sm:w-auto`}
                style={{
                  background: `linear-gradient(to right, ${btnFrom}, ${btnTo})`,
                }}
              >
                {pageConfig?.startQuizText || "Start Quiz"}{" "}
                <ChevronRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            )}
          </CardFooter>
        </Card>
      </motion.div>
    </main>
  );
}
