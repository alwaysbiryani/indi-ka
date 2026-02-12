
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const taglines = [
    { l1: "Baat karo dil se,", l2: "Typing kyu? Chill se." },
    { l1: "बकवास नहीं, काम की बात।", l2: "बोल के देखो, मज़ा आएगा।" },
    { l1: "Speak your mind,", l2: "Let Indi-क write." },
    { l1: "গল্প করো মন খুলে,", l2: "Indi-কাল আছে আপনার সাথে!" },
    { l1: "મોજથી બોલો,", l2: "લખવાની માથાકૂટ છોડો!" },
    { l1: "પટ પટ ಅಂತ ಹೇಳಿ,", l2: "Indi-ಕ ಇದೆ ನೋಡಿ!" },
    { l1: "ನನ್ನಾಗಿ സംസാರಿಸೂ,", l2: "ಇನಿ Indi-ಕ എഴുదుಮ್!" },
    { l1: "मस्त गप्पा मारा,", l2: "Indi-क करेल सगळं काम!" },
    { l1: "ମନ ଭରି କୁହ,", l2: "Indi-କ ଅଛି ସାଥିରେ!" },
    { l1: "ଖੁੱਲ ਕੇ ਬੋਲੋ ਜੀ,", l2: "Indi-ਕ ਕਰੇਗਾ ਬਾਕੀ ਕੰਮ!" },
    { l1: "மனசு விட்டு பேசுங்க,", l2: "Indi-க பாத்துக்கும்!" },
    { l1: "మనసు విప్పి మాట్లాడు,", l2: "Indi-క రాసి పెడుతుంది!" },
];

export function TaglineCycler() {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % taglines.length);
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="h-20 flex flex-col items-center justify-center text-center overflow-hidden mb-8 w-full">
            <AnimatePresence mode="wait">
                <motion.div
                    key={index}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="flex flex-col space-y-2"
                >
                    <p className="text-xl font-bold text-[var(--text-primary)] leading-snug tracking-tight">
                        {taglines[index].l1}
                    </p>
                    <p className="text-xl font-bold bg-gradient-to-r from-[#FF9933] via-[var(--text-primary)] to-[#138808] bg-clip-text text-transparent leading-snug tracking-tight opacity-90">
                        {taglines[index].l2}
                    </p>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
