import { useMemo } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa6";
import { MdKeyboardDoubleArrowLeft, MdKeyboardDoubleArrowRight } from "react-icons/md";
import { getPaginationRange } from "../../js/utils";

const Pagination = ({
    totalItems,
    itemsPerPage,
    currentPage,
    onPageChange,
    onItemsPerPageChange,
    isMobile
}) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    const range = useMemo(() =>
        getPaginationRange(totalItems, itemsPerPage, currentPage),
        [totalItems, itemsPerPage, currentPage]
    );

    if (totalPages <= 1 && totalItems <= 20) return null;

    const PageButton = ({ page, active, disabled, children, className = "" }) => (
        <button
            onClick={() => !disabled && onPageChange(page)}
            disabled={disabled || active}
            className={`
        size-9 md:size-10 flex items-center justify-center rounded-xl font-bold transition-all duration-300
        ${active
                    ? "bg-gradient-primary text-white shadow-[0_0_15px_rgba(176,105,255,0.4)] scale-105"
                    : "bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20 hover:text-white"
                }
        ${disabled ? "opacity-30 cursor-not-allowed grayscale" : "cursor-pointer active:scale-95"}
        ${className}
      `}
        >
            {children || page}
        </button>
    );

    return (
        <div className="flex flex-col items-center gap-6 mt-8 w-full group">
            {/* Items Per Page Selector */}
            {!isMobile && (
                <div className="flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md shadow-lg transition-all duration-300 group-hover:border-white/20">
                    <span className="text-[10px] uppercase font-black tracking-widest text-white/40">Show</span>
                    <div className="flex gap-1">
                        {[20, 50, 100].map((size) => (
                            <button
                                key={size}
                                onClick={() => onItemsPerPageChange(size)}
                                className={`
                  px-3 py-1 rounded-lg text-xs font-bold transition-all
                  ${itemsPerPage === size
                                        ? "bg-gradient-primary text-white"
                                        : "text-white/40 hover:text-white hover:bg-white/5"
                                    }
                `}
                            >
                                {size}
                            </button>
                        ))}
                    </div>
                    <span className="text-[10px] uppercase font-black tracking-widest text-white/40 border-l border-white/10 pl-3">Games per page</span>
                </div>
            )}

            {/* Main Pagination Controls */}
            <div className="flex items-center gap-2 md:gap-3 p-2 bg-white/5 border border-white/10 rounded-[2rem] backdrop-blur-xl shadow-2xl transition-all duration-500 group-hover:border-white/20">
                <div className="flex items-center gap-1 md:gap-2 mr-2">
                    <PageButton page={1} disabled={currentPage === 1}>
                        <MdKeyboardDoubleArrowLeft className="text-lg md:text-xl" />
                    </PageButton>
                    <PageButton page={currentPage - 1} disabled={currentPage === 1}>
                        <FaChevronLeft className="text-xs md:text-sm" />
                    </PageButton>
                </div>

                <div className="flex items-center gap-1 md:gap-2">
                    {range.map((page, i) => (
                        page === "..." ? (
                            <span key={`ellipsis-${i}`} className="w-8 md:w-10 text-center text-white/20 font-black">
                                ...
                            </span>
                        ) : (
                            <PageButton
                                key={page}
                                page={page}
                                active={currentPage === page}
                            />
                        )
                    ))}
                </div>

                <div className="flex items-center gap-1 md:gap-2 ml-2">
                    <PageButton page={currentPage + 1} disabled={currentPage === totalPages}>
                        <FaChevronRight className="text-xs md:text-sm" />
                    </PageButton>
                    <PageButton page={totalPages} disabled={currentPage === totalPages}>
                        <MdKeyboardDoubleArrowRight className="text-lg md:text-xl" />
                    </PageButton>
                </div>
            </div>

            {/* Total Info */}
            <div className="flex items-center gap-3 text-[10px] uppercase font-black tracking-[0.2em] text-white/30">
                <span className="w-12 h-px bg-white/10" />
                <span>Page {currentPage} of {totalPages} ({totalItems} Games)</span>
                <span className="w-12 h-px bg-white/10" />
            </div>
        </div>
    );
};

export default Pagination;
