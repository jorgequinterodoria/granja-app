export default function Skeleton({ className = "", variant = "default", ...props }) {
    const baseClasses = "animate-shimmer bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 bg-[length:1000px_100%] rounded";
    
    const variants = {
        default: "h-4 w-full",
        text: "h-4 w-3/4",
        title: "h-6 w-1/2",
        circle: "h-12 w-12 rounded-full",
        avatar: "h-10 w-10 rounded-full",
        button: "h-10 w-24",
        card: "h-32 w-full",
        line: "h-3 w-full",
        "line-short": "h-3 w-2/3",
        "line-medium": "h-3 w-4/5",
    };

    const variantClasses = variants[variant] || variants.default;

    return (
        <div 
            className={`${baseClasses} ${variantClasses} ${className}`}
            {...props}
        />
    );
}