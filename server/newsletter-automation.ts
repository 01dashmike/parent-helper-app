import { MailService } from '@sendgrid/mail';
import { storage } from './storage.js';
import { validateAndLookupPostcode } from '../client/src/lib/postcode-lookup.js';

const mailService = new MailService();

// Only set API key if it exists in environment
if (process.env.SENDGRID_API_KEY) {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
}

interface ParentingTip {
  title: string;
  content: string;
  ageGroup: string;
  category: 'development' | 'activities' | 'health' | 'behavior' | 'safety';
}

const parentingTips: ParentingTip[] = [
  {
    title: "Building Language Skills Through Play",
    content: "Talk to your baby during everyday activities like changing nappies or feeding. Describe what you're doing - 'Now I'm putting on your clean nappy' or 'Here comes the spoon with yummy carrots!' This constant narration helps build their vocabulary foundation.",
    ageGroup: "0-12 months",
    category: "development"
  },
  {
    title: "Encouraging Independent Play",
    content: "Create a safe play area where your toddler can explore independently for short periods. Start with 10-15 minutes and gradually increase. This builds confidence and problem-solving skills while giving you a brief break!",
    ageGroup: "1-3 years",
    category: "development"
  },
  {
    title: "Managing Toddler Tantrums",
    content: "Stay calm during tantrums - they're a normal part of development. Acknowledge their feelings: 'I can see you're really upset about leaving the park.' Offer comfort without giving in to unreasonable demands. Consistency is key!",
    ageGroup: "1-3 years",
    category: "behavior"
  },
  {
    title: "Tummy Time Success Tips",
    content: "Make tummy time enjoyable by getting down on their level and making silly faces or singing songs. Start with just 2-3 minutes several times a day. Use colorful toys or a mirror to keep them engaged. Remember - supervised tummy time strengthens neck and shoulder muscles!",
    ageGroup: "0-6 months",
    category: "development"
  },
  {
    title: "Creating Bedtime Routines",
    content: "Establish a consistent bedtime routine early - bath, story, cuddles, then bed. Keep the routine the same even when traveling. Dim lights 30 minutes before bedtime to signal it's time to wind down. Consistency helps babies feel secure and sleep better.",
    ageGroup: "0-12 months",
    category: "health"
  },
  {
    title: "Sensory Play Ideas",
    content: "Fill a shallow tray with rice, pasta, or water beads for supervised sensory exploration. Add measuring cups, spoons, and small toys. This develops fine motor skills and provides calming sensory input. Always supervise to prevent choking hazards.",
    ageGroup: "1-4 years",
    category: "activities"
  },
  {
    title: "Encouraging Social Skills",
    content: "Arrange regular playdates with other children, even if they just play alongside each other at first. Model sharing and taking turns. Praise positive social interactions: 'I saw you share your toy - that was very kind!' Social skills develop through practice.",
    ageGroup: "2-5 years",
    category: "development"
  },
  {
    title: "Baby-Proofing Essentials",
    content: "Get down to your baby's level and look for hazards. Secure cabinets, cover electrical outlets, and remove small objects that could be choking hazards. Install safety gates at the top and bottom of stairs before your baby becomes mobile.",
    ageGroup: "6-18 months",
    category: "safety"
  }
];

function getRandomTips(count: number = 2): ParentingTip[] {
  const shuffled = [...parentingTips].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function generateNewsletterContent(
  subscriberName: string,
  nearbyClasses: any[],
  tips: ParentingTip[],
  town: string
): { html: string; text: string } {
  const featuredClasses = nearbyClasses.slice(0, 6);
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Parent Helper Weekly Newsletter</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }
        .section { margin: 20px 0; padding: 20px; background: #f9f9f9; border-radius: 8px; }
        .tip { margin: 15px 0; padding: 15px; background: white; border-left: 4px solid #667eea; border-radius: 4px; }
        .class-card { margin: 10px 0; padding: 15px; background: white; border-radius: 8px; border: 1px solid #e0e0e0; }
        .class-name { font-weight: bold; color: #667eea; margin-bottom: 5px; }
        .class-details { font-size: 14px; color: #666; }
        .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🌟 Parent Helper Weekly</h1>
        <p>Your weekly dose of parenting tips and local class updates</p>
      </div>

      <div class="section">
        <h2>Hello ${subscriberName}! 👋</h2>
        <p>Welcome to your personalized weekly newsletter featuring parenting tips and exciting classes near ${town}!</p>
      </div>

      <div class="section">
        <h2>✨ This Week's Parenting Tips</h2>
        ${tips.map(tip => `
          <div class="tip">
            <h3>${tip.title}</h3>
            <p><strong>Age Group:</strong> ${tip.ageGroup}</p>
            <p>${tip.content}</p>
          </div>
        `).join('')}
      </div>

      ${featuredClasses.length > 0 ? `
        <div class="section">
          <h2>🎈 Featured Classes Near You</h2>
          <p>Here are some wonderful classes happening in and around ${town}:</p>
          ${featuredClasses.map(classItem => `
            <div class="class-card">
              <div class="class-name">${classItem.name}</div>
              <div class="class-details">
                📍 ${classItem.venue}, ${classItem.town}<br>
                👶 Ages ${classItem.ageGroupMin}-${classItem.ageGroupMax}<br>
                📅 ${classItem.dayOfWeek} at ${classItem.time}<br>
                ${classItem.price ? `💷 ${classItem.price}` : '🆓 Free'}
                ${classItem.rating ? `<br>⭐ ${classItem.rating}/5 (${classItem.reviewCount} reviews)` : ''}
              </div>
            </div>
          `).join('')}
          <a href="https://parenthelper.co.uk" class="button">Discover More Classes</a>
        </div>
      ` : ''}

      <div class="section">
        <h2>💡 Quick Parenting Reminders</h2>
        <ul>
          <li>Every child develops at their own pace - trust the process! 🌱</li>
          <li>Taking breaks is not selfish - it's necessary for good parenting 💪</li>
          <li>Celebrate small wins - they add up to big achievements 🎉</li>
          <li>Connect with other parents - you're not alone in this journey 🤝</li>
        </ul>
      </div>

      <div class="section">
        <h2>📅 Coming Up</h2>
        <p>Next week we'll be featuring:</p>
        <ul>
          <li>Tips for introducing solid foods safely</li>
          <li>New classes starting in your area</li>
          <li>Seasonal activities for little ones</li>
        </ul>
      </div>

      <div class="footer">
        <p>💜 Thank you for being part of the Parent Helper community!</p>
        <p>This newsletter was personalized for your area: ${town}</p>
        <p><a href="https://parenthelper.co.uk/newsletter/unsubscribe">Unsubscribe</a> | <a href="https://parenthelper.co.uk">Visit Website</a></p>
      </div>
    </body>
    </html>
  `;

  const textContent = `
PARENT HELPER WEEKLY NEWSLETTER

Hello ${subscriberName}!

Welcome to your personalized weekly newsletter featuring parenting tips and exciting classes near ${town}!

THIS WEEK'S PARENTING TIPS:

${tips.map(tip => `
${tip.title} (${tip.ageGroup})
${tip.content}
`).join('\n')}

${featuredClasses.length > 0 ? `
FEATURED CLASSES NEAR YOU:

${featuredClasses.map(classItem => `
${classItem.name}
Location: ${classItem.venue}, ${classItem.town}
Ages: ${classItem.ageGroupMin}-${classItem.ageGroupMax}
When: ${classItem.dayOfWeek} at ${classItem.time}
Cost: ${classItem.price || 'Free'}
${classItem.rating ? `Rating: ${classItem.rating}/5 (${classItem.reviewCount} reviews)` : ''}
`).join('\n')}

Discover more classes at: https://parenthelper.co.uk
` : ''}

QUICK PARENTING REMINDERS:
- Every child develops at their own pace - trust the process!
- Taking breaks is not selfish - it's necessary for good parenting
- Celebrate small wins - they add up to big achievements
- Connect with other parents - you're not alone in this journey

COMING UP NEXT WEEK:
- Tips for introducing solid foods safely
- New classes starting in your area
- Seasonal activities for little ones

Thank you for being part of the Parent Helper community!

Unsubscribe: https://parenthelper.co.uk/newsletter/unsubscribe
Visit Website: https://parenthelper.co.uk
  `;

  return { html: htmlContent, text: textContent };
}

export async function sendNewsletterToSubscriber(
  subscriber: any,
  fromEmail: string = 'notification@parenthelper.co.uk'
): Promise<boolean> {
  try {
    // Get subscriber's location data
    let town = 'your area';
    let nearbyClasses: any[] = [];

    if (subscriber.postcode) {
      try {
        const locationData = await validateAndLookupPostcode(subscriber.postcode);
        
        // Search for classes near this postcode
        nearbyClasses = await storage.searchClasses({
          postcode: subscriber.postcode,
          radius: 15, // 15 mile radius
          includeInactive: false
        });

        // Extract town name from location or use postcode area
        town = subscriber.postcode.split(' ')[0] + ' area';
      } catch (error) {
        console.warn(`Could not get location data for ${subscriber.postcode}:`, error);
      }
    }

    // Get random parenting tips
    const tips = getRandomTips(2);

    // Generate newsletter content
    const content = generateNewsletterContent(
      subscriber.name || 'Parent',
      nearbyClasses,
      tips,
      town
    );

    // Send email
    await mailService.send({
      to: subscriber.email,
      from: fromEmail,
      replyTo: fromEmail,
      subject: `🌟 Your Weekly Parent Helper Newsletter - Tips & Local Classes`,
      text: content.text,
      html: content.html,
    });

    console.log(`Newsletter sent successfully to ${subscriber.email}`);
    return true;

  } catch (error) {
    console.error(`Failed to send newsletter to ${subscriber.email}:`, error);
    return false;
  }
}

export async function sendNewsletterToAllSubscribers(): Promise<{
  sent: number;
  failed: number;
  errors: string[];
}> {
  try {
    const subscribers = await storage.getNewsletterSubscribers();
    const results = { sent: 0, failed: 0, errors: [] as string[] };

    console.log(`Starting newsletter send to ${subscribers.length} subscribers...`);

    for (const subscriber of subscribers) {
      try {
        const success = await sendNewsletterToSubscriber(subscriber);
        if (success) {
          results.sent++;
        } else {
          results.failed++;
          results.errors.push(`Failed to send to ${subscriber.email}`);
        }
        
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        results.failed++;
        results.errors.push(`Error sending to ${subscriber.email}: ${error}`);
      }
    }

    console.log(`Newsletter campaign completed: ${results.sent} sent, ${results.failed} failed`);
    return results;

  } catch (error) {
    console.error('Failed to send newsletter campaign:', error);
    return { sent: 0, failed: 0, errors: [`Campaign failed: ${error}`] };
  }
}

// Function to schedule weekly newsletters (would be called by a cron job or scheduler)
export async function scheduleWeeklyNewsletter(): Promise<void> {
  console.log('Starting weekly newsletter campaign...');
  const results = await sendNewsletterToAllSubscribers();
  console.log(`Weekly newsletter completed: ${results.sent} sent, ${results.failed} failed`);
  
  if (results.errors.length > 0) {
    console.error('Newsletter errors:', results.errors);
  }
}