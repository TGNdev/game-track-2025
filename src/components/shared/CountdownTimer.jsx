import { useState, useEffect } from "react";
import { isPast } from "date-fns";

const CountdownTimer = ({ targetDate }) => {
  const [timeLeft, setTimeLeft] = useState(null);
  const [hasPassed, setHasPassed] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const target = new Date(targetDate.seconds * 1000);

      if (isPast(target)) {
        setHasPassed(true);
        return;
      }

      const totalSeconds = Math.floor((target - now) / 1000);
      const days = Math.floor(totalSeconds / (3600 * 24));
      const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      setTimeLeft({ days, hours, minutes, seconds });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (hasPassed) {
    return (
      <div className="text-sm font-black text-green-400 animate-pulse">
        RELEASED !
      </div>
    );
  }

  if (!timeLeft) return null;

  const {
    days = 0,
    hours = 0,
    minutes = 0,
    seconds = 0
  } = timeLeft;

  return (
    <div className="flex gap-2 items-center">
      <div className="flex flex-col items-center">
        <span className="text-3xl font-black tabular-nums">{days}</span>
        <span className="text-xs uppercase font-black opacity-50">Days</span>
      </div>
      <span className="text-xl font-black opacity-30">:</span>
      <div className="flex flex-col items-center">
        <span className="text-3xl font-black tabular-nums">{String(hours).padStart(2, '0')}</span>
        <span className="text-xs uppercase font-black opacity-50">Hrs</span>
      </div>
      <span className="text-xl font-black opacity-30">:</span>
      <div className="flex flex-col items-center">
        <span className="text-3xl font-black tabular-nums">{String(minutes).padStart(2, '0')}</span>
        <span className="text-xs uppercase font-black opacity-50">Min</span>
      </div>
      <span className="text-xl font-black opacity-30">:</span>
      <div className="flex flex-col items-center">
        <span className="text-3xl font-black tabular-nums">{String(seconds).padStart(2, '0')}</span>
        <span className="text-xs uppercase font-black opacity-50">Sec</span>
      </div>
    </div>
  );
};

export default CountdownTimer;
