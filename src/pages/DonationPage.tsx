// src/pages/DonationPage.tsx

import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, Coffee } from 'lucide-react';
import { OrnateSeparator } from '@/components/OrnateSeparator';

const DonationPage: React.FC = () => {
    // This is your unique Konnect payment link
    const konnectLink = "https://gateway.konnect.network/me/Marven";

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="text-center">
                <h2 className="text-3xl font-display font-bold tracking-tight">Support FocusFlow</h2>
                <p className="text-muted-foreground">Help keep the magic alive and the sage wise.</p>
            </div>

            <OrnateSeparator />

            <Card className="max-w-2xl mx-auto text-center animate-slide-up-fade" style={{animationDelay: '0.2s'}}>
                <CardHeader>
                    <div className="flex justify-center mb-4">
                        <Heart className="h-16 w-16 text-destructive" />
                    </div>
                    <CardTitle className="font-display text-2xl">A Contribution of Clarity</CardTitle>
                    <CardDescription className="font-serif text-base">
                        If FocusFlow has brought a measure of peace and clarity to your days, consider supporting its development. Your contribution helps maintain the app, fuel the AI sage, and brew the coffee that powers its creation.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground mb-4">
                        All donations are processed securely through Konnect. You can contribute any amount you wish. Every single bit helps and is deeply appreciated!
                    </p>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <a href={konnectLink} target="_blank" rel="noopener noreferrer">
                        <Button size="lg">
                            <Coffee className="mr-2 h-5 w-5" />
                            Buy the Sage a Coffee
                        </Button>
                    </a>
                </CardFooter>
            </Card>
        </div>
    );
};

export default DonationPage;