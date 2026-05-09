import React from "react";
interface ButtonProps {
  title: string;
  className?: string;
  active?: boolean;
  onlick?: () => void;
}
const Button = ({ title, className, active, onlick }: ButtonProps) => {
  return (
    <button
      className={
        active
          ? `${className} "text-base font-semibold text-[#173c77] py-1 px-3 capitalize" `
          : "text-base font-semibold text-gray-500 capitalize cursor-pointer"
      }
      onClick={onlick}
    >
      {title}
    </button>
  );
};

export default Button;
