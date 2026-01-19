import { useRef, useState, useEffect } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa6';

const ScrollableContainer = ({ children }) => {
  const scrollRef = useRef(null);
  const [showStart, setShowStart] = useState(false);
  const [showEnd, setShowEnd] = useState(false);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      const canScroll = scrollWidth > clientWidth;
      setShowStart(canScroll && scrollLeft > 20);
      setShowEnd(canScroll && scrollLeft < scrollWidth - clientWidth - 20);
    }
  };

  useEffect(() => {
    checkScroll();
    const timer = setTimeout(checkScroll, 100);
    window.addEventListener('resize', checkScroll);
    return () => {
      window.removeEventListener('resize', checkScroll);
      clearTimeout(timer);
    };
  }, [children]);

  const scrollTo = (direction) => {
    if (scrollRef.current) {
      const { scrollWidth } = scrollRef.current;
      const target = direction === 'start' ? 0 : scrollWidth;
      scrollRef.current.scrollTo({ left: target, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative group w-full">
      <div>
        {showStart && (
          <button
            onClick={() => scrollTo('start')}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-white/10 text-white p-3 rounded-full backdrop-blur-md border border-white/20 transition hover:scale-105 shadow-2xl flex items-center justify-center"
            title="Scroll to start"
          >
            <FaChevronLeft className="size-5" />
          </button>
        )}
      </div>

      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex gap-6 pb-6 w-full overflow-x-auto scrollbar-hide"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {children}
      </div>

      <div>
        {showEnd && (
          <button
            onClick={() => scrollTo('end')}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-white/10 text-white p-3 rounded-full backdrop-blur-md border border-white/20 transition hover:scale-105 shadow-2xl flex items-center justify-center"
            title="Scroll to end"
          >
            <FaChevronRight className="size-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ScrollableContainer;
