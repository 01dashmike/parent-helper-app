import Header from "@/components/header";
import Footer from "@/components/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, ArrowLeft, Heart, AlertTriangle } from "lucide-react";
import { Link } from "wouter";

export default function BlogNewbornBehavior() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-white to-sage-light">
      <Header />
      
      {/* Article Header */}
      <section className="py-16 bg-gradient-to-r from-teal-700 to-teal-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/blog">
            <Button variant="outline" className="mb-6 text-white border-white hover:bg-white hover:text-teal-600">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Blog
            </Button>
          </Link>
          
          <div className="flex items-center gap-2 text-teal-100 mb-4">
            <Calendar className="w-4 h-4" />
            May 26, 2025
            <Clock className="w-4 h-4 ml-4" />
            6 min read
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold font-poppins mb-4">
            👶 Understanding Your Newborn Baby: Cries, Body Language & Common Concerns
          </h1>
          
          <p className="text-xl text-teal-100 leading-relaxed">
            The first few weeks with your baby are magical — and often, overwhelming. Every sound, wriggle, and cry can leave you wondering: What do they need? Are they okay? Why won't they settle?
          </p>
        </div>
      </section>

      {/* Article Content */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none">
            
            <p className="text-lg text-sage leading-relaxed mb-8">
              The good news is that babies are communicating — just not with words. Once you learn the cues, patterns, and common issues that come with newborns, you'll feel more confident responding to their needs and supporting their development.
            </p>

            {/* Why Do Newborns Cry */}
            <div className="mb-10">
              <h2 className="text-3xl font-bold text-teal-dark mb-6 flex items-center gap-3">
                😭 Why Do Newborns Cry?
              </h2>
              
              <p className="text-lg text-sage leading-relaxed mb-6">
                Crying is the most powerful — and normal — way a baby communicates in the early weeks. It's their signal that something needs attention. And while it can feel hard to decode at first, different types of cries often have different meanings.
              </p>
              
              <h3 className="text-2xl font-bold text-purple-600 mb-4">Common Types of Newborn Cries</h3>
              
              <div className="bg-sage-50 p-6 rounded-lg mb-6">
                <ul className="space-y-3 text-sage">
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-coral rounded-full mt-2"></span>
                    <span><strong>Rhythmic, sucking sounds</strong> – Hunger (offer a feed)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-coral rounded-full mt-2"></span>
                    <span><strong>Fussy whimpering</strong> – Tiredness or overstimulation (rock, swaddle, dim lights)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-coral rounded-full mt-2"></span>
                    <span><strong>Sharp or gassy cries</strong> – Wind or tummy discomfort (burp or use tummy massage)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-coral rounded-full mt-2"></span>
                    <span><strong>High-pitched, intense</strong> – Pain or colic (consult HV/GP if persistent)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-coral rounded-full mt-2"></span>
                    <span><strong>Whiny, grumbling</strong> – Boredom or discomfort (check basics, cuddle)</span>
                  </li>
                </ul>
              </div>
              
              {/* Enhanced Downloadable Cheat Sheet */}
              <div className="mt-6 mb-8">
                <h3 className="text-xl font-bold text-purple-600 mb-4">📥 Free Download: Newborn Cries & Cues Cheat Sheet</h3>
                <p className="text-sage mb-4">
                  Feeling overwhelmed by your baby's cries and cues? Download our simple one-page reference guide to help decode common newborn behaviours — now includes the Shh method! Perfect for printing or saving on your phone.
                </p>
                <a 
                  href="/downloads/Newborn_Cries_and_Cues_Cheat_Sheet_Updated.pdf" 
                  download
                  className="inline-block bg-coral text-white font-bold py-3 px-5 rounded-lg text-base hover:bg-coral-600 transition-colors"
                >
                  📄 Download Cheat Sheet (PDF)
                </a>
              </div>
            </div>

            {/* Understanding Body Language */}
            <div className="mb-10">
              <h2 className="text-3xl font-bold text-teal-dark mb-6">
                🤲 Understanding Newborn Body Language
              </h2>
              
              <p className="text-lg text-sage leading-relaxed mb-6">
                Your baby is always communicating — even when they're not crying. Learning to read their body language can help you respond before distress builds up.
              </p>
              
              <h3 className="text-2xl font-bold text-purple-600 mb-4">Common Cues:</h3>
              
              <div className="bg-blue-50 p-6 rounded-lg">
                <ul className="space-y-3 text-blue-700">
                  <li className="flex items-start gap-3">
                    <span className="text-2xl">🍼</span>
                    <span><strong>Sucking hands, turning head:</strong> Hunger or comfort-seeking</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-2xl">🔄</span>
                    <span><strong>Arching back:</strong> Wind or reflux discomfort</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-2xl">😣</span>
                    <span><strong>Red face, clenched fists:</strong> Tension or pain</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-2xl">👀</span>
                    <span><strong>Gaze aversion:</strong> Overstimulated or needs space</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-2xl">⚡</span>
                    <span><strong>Jerky movements:</strong> Startled or needs calming</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-2xl">😴</span>
                    <span><strong>Yawning, slow blinking:</strong> Tired</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-2xl">👁️</span>
                    <span><strong>Wide eyes and stillness:</strong> Alert or overstimulated</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* What Is Colic */}
            <div className="mb-10">
              <h2 className="text-3xl font-bold text-teal-dark mb-6">
                😰 What Is Colic? (And How Can You Help?)
              </h2>
              
              <p className="text-lg text-sage leading-relaxed mb-6">
                Colic is defined as excessive crying for more than 3 hours per day, 3 days a week, for at least 3 weeks — often starting around 2–3 weeks and peaking at 6–8 weeks.
              </p>
              
              <p className="text-sage mb-6">
                Signs include intense evening crying, leg tucking, clenched fists, and difficulty settling.
              </p>
              
              <h3 className="text-2xl font-bold text-purple-600 mb-4">What Might Help:</h3>
              
              <div className="bg-coral-50 p-6 rounded-lg">
                <ul className="space-y-3 text-coral-700">
                  <li className="flex items-start gap-3">
                    <span className="text-2xl">⬆️</span>
                    <span>Hold baby upright after feeds</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-2xl">🚴</span>
                    <span>Bicycle legs or tummy massage</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-2xl">🔊</span>
                    <span>Use white noise or soft motion</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-2xl">🍼</span>
                    <span>Try <a href="https://amzn.to/4dy1Q5D" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">anti-colic bottles</a> (linked below)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-2xl">🤫</span>
                    <span><strong>Shh Method:</strong> Make a loud, steady "shhhh" sound near baby's ear to mimic womb noise and trigger calming reflex</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Common Newborn Behaviours */}
            <div className="mb-10">
              <h2 className="text-3xl font-bold text-teal-dark mb-6">
                📋 Other Common Newborn Behaviours & Concerns
              </h2>
              
              <div className="space-y-6">
                <div className="bg-green-50 p-6 rounded-lg border-l-4 border-green-400">
                  <h3 className="text-xl font-bold text-green-800 mb-2">Cluster Feeding</h3>
                  <p className="text-green-700">Frequent evening feeds help increase milk supply and soothe baby — normal during growth spurts.</p>
                </div>
                
                <div className="bg-yellow-50 p-6 rounded-lg border-l-4 border-yellow-400">
                  <h3 className="text-xl font-bold text-yellow-800 mb-2">Reflux & Spit-Up</h3>
                  <p className="text-yellow-700">Common and usually harmless. Try feeding upright and smaller, more frequent feeds.</p>
                </div>
                
                <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-400">
                  <h3 className="text-xl font-bold text-blue-800 mb-2">Wind & Night Grunting</h3>
                  <p className="text-blue-700">Try burping during/after feeds, tummy time, massage, and warm baths.</p>
                </div>
              </div>
            </div>

            {/* When to Contact GP */}
            <div className="mb-10">
              <h2 className="text-3xl font-bold text-teal-dark mb-6 flex items-center gap-3">
                <AlertTriangle className="w-8 h-8 text-red-600" />
                When to Contact Your GP or HV
              </h2>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <ul className="space-y-2 text-red-700">
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-red-500 rounded-full mt-2"></span>
                    <span>Fewer than 6 wet nappies per day</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-red-500 rounded-full mt-2"></span>
                    <span>Poor or refused feeding</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-red-500 rounded-full mt-2"></span>
                    <span>High-pitched or persistent crying</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-red-500 rounded-full mt-2"></span>
                    <span>Fever over 38°C</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-red-500 rounded-full mt-2"></span>
                    <span>Lethargy or floppy limbs</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-red-500 rounded-full mt-2"></span>
                    <span>Rash that doesn't fade</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-red-500 rounded-full mt-2"></span>
                    <span>Projectile or green vomit</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-red-500 rounded-full mt-2"></span>
                    <span>Concerns over weight or breathing</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Helpful Products */}
            <div className="mb-10">
              <h2 className="text-3xl font-bold text-teal-dark mb-6">
                🛒 Helpful Products for the Newborn Phase
              </h2>
              
              <p className="text-lg text-sage leading-relaxed mb-6">
                These parent-tested essentials can help with soothing, sleep, and digestion:
              </p>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <div className="grid gap-4">
                  <div className="flex items-start gap-3">
                    <span className="text-gray-600 mt-1">•</span>
                    <div>
                      <strong><a href="https://amzn.to/4jhCJp3" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">White Noise Machine</a></strong> – Helps soothe and settle baby
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-gray-600 mt-1">•</span>
                    <div>
                      <strong><a href="https://amzn.to/4dy1Q5D" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">Anti-Colic Bottles (Dr. Brown's)</a></strong> – Reduce wind and reflux
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-gray-600 mt-1">•</span>
                    <div>
                      <strong><a href="https://amzn.to/3Zzgbc9" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">Swaddle Wraps / Sleep Sacks</a></strong> – Reduce startle reflex
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-gray-600 mt-1">•</span>
                    <div>
                      <strong><a href="https://amzn.to/44PbqPf" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">Chalkboard Labels</a></strong> – Track feeds and sleep
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Affiliate Note */}
            <div className="mb-10">
              <h2 className="text-3xl font-bold text-teal-dark mb-6">
                💷 Affiliate Note
              </h2>
              
              <div className="bg-yellow-50 p-6 rounded-lg border-l-4 border-yellow-400">
                <p className="text-yellow-800">
                  This blog contains affiliate links. We may earn a small commission (at no extra cost to you) if you purchase through these links. Thank you for supporting our content!
                </p>
              </div>
            </div>

            {/* Conclusion */}
            <Card className="bg-gradient-to-r from-teal-50 to-sage-50 border-2 border-teal-200">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold text-teal-dark mb-4 flex items-center gap-3">
                  <Heart className="w-6 h-6 text-coral" />
                  Final Thoughts
                </h2>
                <p className="text-lg text-sage leading-relaxed mb-4">
                  Every baby is different. Some days will be easier than others. Trust your instincts, ask for help when needed, and remember: your baby doesn't need perfection — just love, presence, and care.
                </p>
                <p className="text-xl font-semibold text-teal-dark">
                  You're doing a great job. ❤️
                </p>
              </CardContent>
            </Card>

            {/* Call to Action */}
            <div className="text-center mt-12">
              <Card className="bg-coral-50 border-coral-200">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold text-coral-800 mb-4">Need More Newborn Support?</h3>
                  <p className="text-coral-700 mb-6">
                    Join our newsletter for weekly tips, developmental milestones, and gentle parenting advice.
                  </p>
                  <Button className="bg-coral hover:bg-coral-600 text-white font-semibold px-8 py-3">
                    Subscribe to Newsletter
                  </Button>
                </CardContent>
              </Card>
            </div>

          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}