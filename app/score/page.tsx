"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useQuizContext } from "@/context/quiz-context";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, Trophy, Sparkles } from "lucide-react";
import { useMobile } from "@/hooks/use-mobile";
import UserInfoDisplay from "@/components/user-info-display";
import axios from "axios";

interface Winner {
  winner_name: string;
  phone_number: string;
  draw_id: number;
  draw_time: string;
  lottery_type: string;
}

export default function WinnersByTimeSlotPage() {
  const { isLoggedIn } = useQuizContext();
  const router = useRouter();
  const isMobile = useMobile();
  const [winners, setWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const userToken = localStorage.getItem("auth_token");

    if (!isLoggedIn) {
      router.push("/login");
      return;
    }

    const fetchWinners = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/winners_list`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: userToken, // ensure your context provides userToken
            },
          }
        );

        setWinners(response.data);
      } catch (err: any) {
        console.error("Error fetching winners:", err);
        setError("Failed to load winners. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchWinners();
  }, [isLoggedIn, router]);

  const goBack = () => {
    router.push("/contest");
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (!isLoggedIn || loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-[#0b1236] via-[#0f1a4a] to-[#091029]">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-20 h-20 border-t-4 border-blue-500 border-solid rounded-full animate-spin"
        />
        <p className="mt-4 text-white text-xl">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center text-center bg-gradient-to-br from-[#0b1236] via-[#0f1a4a] to-[#091029] text-white p-6">
        <Trophy className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-lg">{error}</p>
        <Button
          onClick={goBack}
          variant="outline"
          className="mt-4 bg-white/5 border-white/10 text-white hover:bg-white/10"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Contest
        </Button>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-4 bg-gradient-to-br from-[#0b1236] via-[#0f1a4a] to-[#091029] relative">
      <UserInfoDisplay />

      {/* Background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl" />
        {Array.from({ length: 15 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white/5"
            style={{
              width: Math.random() * 6 + 2,
              height: Math.random() * 6 + 2,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{ y: [0, -10, 0], opacity: [0.2, 0.5, 0.2] }}
            transition={{
              duration: 2 + Math.random() * 3,
              repeat: Number.POSITIVE_INFINITY,
              repeatType: "reverse",
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl z-10 mt-16 sm:mt-8"
      >
        {/* Header */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20 mb-6">
          <CardHeader className="p-6 text-center">
            <div className="flex justify-center mb-4">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{
                  duration: 5,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatType: "reverse",
                }}
              >
                <Trophy className="h-12 w-12 sm:h-16 sm:w-16 text-yellow-400" />
              </motion.div>
            </div>
            <CardTitle className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">
              Lottery Winners
            </CardTitle>
            <CardDescription className="text-white/70 text-base sm:text-lg">
              View all past lottery winners
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Winners List */}
        <div className="space-y-4 mb-6 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
          {winners.length === 0 ? (
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardContent className="p-8 text-center">
                <Trophy className="h-12 w-12 text-white/40 mx-auto mb-4" />
                <p className="text-white/70">No winners yet. Be the first!</p>
              </CardContent>
            </Card>
          ) : (
            winners.map((winner, index) => (
              <motion.div
                key={`winner-${winner.draw_id}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05, duration: 0.5 }}
              >
                <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-colors overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-500/10 to-amber-500/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                  <CardContent className="p-4 sm:p-6 relative z-10">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <Sparkles className="h-6 w-6 text-yellow-400" />
                        </div>
                        <div>
                          <p className="text-xl sm:text-2xl font-bold text-white capitalize">
                            {winner.winner_name}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              variant="outline"
                              className="border-amber-500/30 text-amber-300 text-xs"
                            >
                              Draw #{winner.draw_id}
                            </Badge>
                            <Badge className="bg-purple-500/20 text-purple-300 text-xs">
                              {winner.lottery_type}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col sm:text-right gap-1">
                        <div className="flex items-center sm:justify-end gap-2">
                          <Clock className="h-4 w-4 text-white/60" />
                          <p className="text-white font-medium text-sm sm:text-base">
                            {formatDate(winner.draw_time)}
                          </p>
                        </div>
                        <p className="text-white/70 text-xs sm:text-sm">
                          {formatTime(winner.draw_time)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>

        <div className="flex justify-center">
          <Button
            onClick={goBack}
            variant="outline"
            className="bg-white/5 border-white/10 text-white hover:bg-white/10 w-full sm:w-auto"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Contest
          </Button>
        </div>
      </motion.div>
    </main>
  );
}