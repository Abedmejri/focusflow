// src/pages/AICoachPage.tsx

import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { cn } from '@/lib/utils';
import Lottie, { LottieRefCurrentProps } from 'lottie-react';
import { TypeAnimation } from 'react-type-animation'; // NEW: Import for typing effect

import sageAnimation from '../../public/Nostradamus.json'; 

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Moon, Sparkles, Send } from 'lucide-react';
import { Card } from '@/components/ui/card';

// We no longer need the message list state in the same way.
// We'll track the AI's current message and the overall state.
type CoachState = 'idle' | 'thinking' | 'talking' | 'action';

const AICoachPage: React.FC = () => {
    const [coachState, setCoachState] = useState<CoachState>('idle');
    const [currentMessage, setCurrentMessage] = useState<string>("Hello! I am the Clarity Sage. How can I help you find focus today?");
    const [inputValue, setInputValue] = useState("");
    const lottieRef = useRef<LottieRefCurrentProps>(null);
    const { user } = useAuth(); // We'll need this for quick actions

    // Animation Control Logic
    useEffect(() => {
        switch (coachState) {
            case 'thinking':
                // Play "thinking" animation loop (e.g., frames 121-200)
                lottieRef.current?.playSegments([121, 200], true);
                break;
            case 'talking':
                // Play "talking" animation once (e.g., frames 201-300)
                lottieRef.current?.playSegments([201, 300], false);
                break;
            case 'idle':
            default:
                // Play "idle" animation loop (e.g., frames 0-120)
                lottieRef.current?.playSegments([0, 120], true);
                break;
        }
    }, [coachState]);

    const handleSendMessage = async (prompt: string) => {
        if (!prompt.trim() || coachState !== 'idle') return;

        setCoachState('thinking');
        setCurrentMessage("Let me ponder on that for a moment..."); // Thinking message
        setInputValue(""); // Clear input

        try {
            const { data, error } = await supabase.functions.invoke('ai-coach', { body: { prompt } });
            if (error) throw error;
            if (!data.response) throw new Error("The sage seems to be lost in thought...");
            
            setCoachState('talking');
            setCurrentMessage(data.response); // Set the real message

        } catch (error: any) {
            toast.error("The sage's crystal ball seems cloudy. Please try again later.");
            setCurrentMessage("My apologies, my thoughts are unclear. Please ask again.");
            setCoachState('talking');
        }
    };
    
    const handleRoutineAction = async (timeOfDay: 'morning' | 'evening') => {
        if (coachState !== 'idle') return;

        setCoachState('thinking');
        setCurrentMessage(`Crafting a ${timeOfDay} routine for you...`);

        try {
            const { data, error } = await supabase.functions.invoke('generate-routine', { body: { timeOfDay } });
            if (error) throw error;

            setCoachState('talking');
            setCurrentMessage(data.message);
            toast.success("Routine updated!", { description: `New habits have been added to your ${timeOfDay} routine page.` });
        } catch(error: any) {
            toast.error(error.message || `Failed to generate ${timeOfDay} routine.`);
            setCurrentMessage("I seem to have misplaced my quill. Could you ask again?");
            setCoachState('talking');
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)] animate-fade-in">
            <div className="relative flex-1 w-full flex items-center justify-center">
                {/* Wizard Animation */}
                <Lottie 
                    lottieRef={lottieRef}
                    animationData={sageAnimation}
                    loop={true} 
                    className="h-[450px] w-[450px]" 
                />
                
                {/* --- NEW: The Speech Bubble --- */}
                {currentMessage && (
                    <div 
                        key={currentMessage} // Force re-render for typing animation
                        className={cn(
                            "absolute top-1/4 left-1/2 w-80 max-w-[90vw] p-4 rounded-lg shadow-xl bg-card border animate-fade-in",
                            "before:content-[''] before:absolute before:w-0 before:h-0 before:border-[10px]",
                            "before:border-t-card before:border-r-transparent before:border-b-transparent before:border-l-transparent",
                            "before:-bottom-5 before:left-1/2 before:-translate-x-1/2",
                            coachState === 'thinking' && "opacity-80 italic"
                        )}
                    >
                        <div className="prose prose-sm text-card-foreground prose-p:my-1">
                            {coachState === 'talking' ? (
                                <TypeAnimation
                                    sequence={[
                                        currentMessage,
                                        () => { setCoachState('idle'); } // Return to idle after typing
                                    ]}
                                    wrapper="p"
                                    speed={60}
                                    cursor={true}
                                />
                            ) : (
                                <p>{currentMessage}</p>
                            )}
                        </div>
                    </div>
                )}
            </div>
            
            {/* Input and Actions Area */}
            <div className="mt-auto space-y-4 pt-4 border-t">
                <div className="flex flex-wrap justify-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleRoutineAction('morning')} disabled={coachState !== 'idle'}>
                        {coachState === 'action' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <Sparkles className="mr-2 h-4 w-4"/>Suggest Morning Routine
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleRoutineAction('evening')} disabled={coachState !== 'idle'}>
                        {coachState === 'action' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <Sparkles className="mr-2 h-4 w-4"/>Suggest Evening Routine
                    </Button>
                </div>
                <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(inputValue); }} className="flex w-full max-w-lg mx-auto items-center space-x-2">
                    <Input value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Speak your mind to the sage..." className="flex-1" disabled={coachState !== 'idle'}/>
                    <Button type="submit" size="icon" disabled={coachState !== 'idle' || !inputValue.trim()}><Send className="h-4 w-4"/></Button>
                </form>
            </div>
        </div>
    );
};

export default AICoachPage;