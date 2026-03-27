"use client";

// components/Navbar.jsx

import { Link } from "react-router-dom";
import Logo from "../UI/Logo";
import ButtonAnimatedGradient from "../UI/ButtonAnimatedGradient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import DropdownComponent from "../UI/DropdownComponent";
import { Lock, LogOut, Menu, User } from "lucide-react";
import axiosInstance from "../../lib/axiosIntance";
import AvatarComponent from "../UI/AvatarComponent";
import { useToast } from "../UI/ToastManager";
import { useUser } from "../../store/user/useUser";


export default function Navbar() {
  const handleOptionSelect = (value) => {
    if (value === "signout") {
      console.log("Signout triggered");
      Signout();
    }
  };

  

  const queryClient = useQueryClient();
  const { addToast } = useToast();
const {  user:authUser } = useUser();
  const { mutate: Signout } = useMutation({
    mutationFn: () => axiosInstance.post("/auth/signout"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
      addToast("Signed Out successfully!", {
        type: "success",
        duration: 3000,
      });
    },
  });
  const options = [
    { label: "Profile", value: "profile", icon: <User />, href: `/profile/${authUser?.username}` },
    { label: "admin", value: "admin", icon: <Lock />, href: "/admin" },
    { label: "Sign Out", value: "signout", icon: <LogOut /> },
  ];
  return (
    <nav className="bg-white shadow-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
       
          <a href="/">
            <Logo
              variant="icon"
              className="mx-auto w-20 transition-transform duration-300 hover:scale-105"
            />
          </a>

        
          {authUser ? (
            <div className="flex items-center  ">
              <DropdownComponent
                triggerElement={<AvatarComponent src={authUser.avatar} />}
                options={options}
                className="z-50"
                onSelect={handleOptionSelect}
                variant="default"
              />
            </div>
          ) : (
            <div className="hidden md:flex items-center space-x-4">
              <Link to={"/signup"}>
                <ButtonAnimatedGradient variant="glass">
                  Signup
                </ButtonAnimatedGradient>
              </Link>
              <Link to={"/signin"}>
                <ButtonAnimatedGradient>SignIn</ButtonAnimatedGradient>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
