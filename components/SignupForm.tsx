"use client";

import type React from "react";
import { useState } from "react";
import { motion } from "framer-motion";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useQuizContext } from "@/context/quiz-context";
import { useSiteConfig } from "@/context/site-config-context";
import { Brain, Mail, MapPin, Building2 } from "lucide-react";
import { useMobile } from "@/hooks/use-mobile";
import { useRouter } from "next/navigation";
import PhoneInput, { parsePhoneNumber } from "react-phone-number-input";
import Link from "next/link";
import 'react-phone-number-input/style.css'

export default function SignupForm() {
  const { setUserInfo, setIsLoggedIn } = useQuizContext();
  const { config } = useSiteConfig();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState(config?.pages?.signup?.defaultCountry || "ET");
  const [region, setRegion] = useState("");
  const [city, setCity] = useState("");
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    phone: "",
    region: "",
    city: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  // Config values with fallbacks
  const pageConfig = config?.pages?.signup;
  const theme = config?.theme;
  const media = config?.media;
  const sections = config?.sections;
  const branding = config?.branding;

  const gradientFrom = theme?.primaryGradientFrom || "#0b1236";
  const gradientVia = theme?.primaryGradientVia || "#0f1a4a";
  const gradientTo = theme?.primaryGradientTo || "#091029";
  const btnFrom = theme?.buttonGradientFrom || "#0284c7";
  const btnTo = theme?.buttonGradientTo || "#2563eb";
  const overlayOpacity = theme?.overlayOpacity ?? 0.6;

  const validateForm = () => {
    const newErrors = { name: "", email: "", phone: "", region: "", city: "" };
    let isValid = true;

    if (!name.trim()) {
      newErrors.name = "Name is required";
      isValid = false;
    }

    if (!email.trim()) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
      isValid = false;
    }

    if (!phone) {
      newErrors.phone = "Phone number is required";
      isValid = false;
    }

    if (!region.trim()) {
      newErrors.region = "Region is required";
      isValid = false;
    }

    if (!city.trim()) {
      newErrors.city = "City is required";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm() && !isSubmitting) {
      setIsSubmitting(true);

      try {
        const payload = {
          name,
          phone_number: phone,
          email,
          country,
          region,
          city,
        };

        const response = await api.post('/auth/register', payload);

        console.log("Signup API response:", response.data);
        const token = response.data.auth_token;

        localStorage.setItem("auth_token", token);
        localStorage.setItem(
          "user_info",
          JSON.stringify({ name, email, phone })
        );
        setUserInfo({ name, email, phone, country, region, city });
        setIsLoggedIn(true);
        router.push("/contest");
      } catch (error: any) {
        console.error(
          "Error during signup:",
          error.response?.data || error.message
        );
        alert(
          error.response?.data?.message || "Signup failed. Please try again."
        );
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const defaultCountry = (pageConfig?.defaultCountry || "ET") as any;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md px-4 sm:px-0"
    >
      {/* Background */}
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
          className="absolute top-0 left-0 w-full h-[100vh] object-cover blur-sm scale-105 z-0"
          style={{ backgroundImage: `url(${media.backgroundImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
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

      <Card className="bg-white/10 backdrop-blur-md border-white/20 relative z-20">
        <CardHeader className="space-y-1 text-center p-4 sm:p-6">
          <div className="flex justify-center mb-2">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{
                duration: 0.5,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "reverse",
                repeatDelay: 5,
              }}
            >
              {sections?.showLogo !== false && branding?.logoUrl && (
                <img className="h-14" src={branding.logoUrl} alt={branding?.organizationName || "Logo"} />
              )}
            </motion.div>
          </div>
          <CardTitle className="text-xl sm:text-2xl font-bold text-white">
            {pageConfig?.title || "Create Your Account"}
          </CardTitle>
          <CardDescription className="text-white/70 text-sm sm:text-base">
            {pageConfig?.subtitle || "Sign up to join the tech quiz contest"}
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 p-4 sm:p-6">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white text-sm sm:text-base">
                Full Name
              </Label>
              <Input
                id="name"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 text-sm sm:text-base"
              />
              {errors.name && (
                <p className="text-red-400 text-xs sm:text-sm mt-1">
                  {errors.name}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-white text-sm sm:text-base"
              >
                Email Address
              </Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50 text-sm sm:text-base pl-10"
                />
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/50" />
              </div>
              {errors.email && (
                <p className="text-red-400 text-xs sm:text-sm mt-1">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Phone Number with Country Extraction */}
            <div className="space-y-2">
              <Label
                htmlFor="phone"
                className="text-white text-sm sm:text-base"
              >
                Phone Number
              </Label>
              <div className="phone-input-container">
                <PhoneInput
                  international
                  countryCallingCodeEditable={false}
                  defaultCountry={defaultCountry}
                  value={phone}
                  onChange={(value) => {
                    setPhone(value || "");
                    try {
                      if (value) {
                        const phoneNumber = parsePhoneNumber(value);
                        console.log("phoneNumber", phoneNumber);
                        setCountry(phoneNumber?.country || "");
                      } else {
                        setCountry("");
                      }
                    } catch {
                      setCountry("");
                    }
                  }}
                  className="bg-white/10 border-white/20 rounded-md text-white"
                />
              </div>
              {errors.phone && (
                <p className="text-red-400 text-xs sm:text-sm mt-1">
                  {errors.phone}
                </p>
              )}
            </div>

            {/* Region / City */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="region"
                  className="text-white text-sm sm:text-base"
                >
                  Region/State
                </Label>
                <div className="relative">
                  <Input
                    id="region"
                    placeholder="e.g., Addis Ababa"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 text-sm sm:text-base pl-10"
                  />
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/50" />
                </div>
                {errors.region && (
                  <p className="text-red-400 text-xs sm:text-sm mt-1">
                    {errors.region}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="city"
                  className="text-white text-sm sm:text-base"
                >
                  City
                </Label>
                <div className="relative">
                  <Input
                    id="city"
                    placeholder="e.g., Addis Ababa"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 text-sm sm:text-base pl-10"
                  />
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/50" />
                </div>
                {errors.city && (
                  <p className="text-red-400 text-xs sm:text-sm mt-1">
                    {errors.city}
                  </p>
                )}
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 p-4 sm:p-6 pt-0 sm:pt-0">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full text-sm sm:text-base"
              style={{
                background: `linear-gradient(to right, ${btnFrom}, ${btnTo})`,
              }}
            >
              {isSubmitting
                ? (pageConfig?.submittingText || "Creating Account...")
                : (pageConfig?.submitButtonText || "Create Account")}
            </Button>

            <div className="text-center text-sm text-white/70">
              {pageConfig?.loginLinkText || "Already have an account?"}{" "}
              <Link
                href="/login"
                className="text-cyan-400 hover:text-cyan-300 underline"
              >
                {pageConfig?.loginLinkLabel || "Sign in here"}
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </motion.div>
  );
}
