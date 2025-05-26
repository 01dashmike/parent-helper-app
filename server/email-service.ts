import { MailService } from '@sendgrid/mail';

const mailService = new MailService();

// Only set API key if it exists in environment
if (process.env.SENDGRID_API_KEY) {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
}

interface ClassSubmissionEmailParams {
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  className: string;
  description: string;
  ageRange: string;
  dayTime: string;
  cost: string;
  postcode: string;
  website?: string;
  socialMedia?: string;
}

export async function sendClassSubmissionNotification(
  params: ClassSubmissionEmailParams
): Promise<boolean> {
  // Check if SendGrid is configured
  if (!process.env.SENDGRID_API_KEY) {
    console.log('SendGrid API key not configured, skipping email notification');
    return false;
  }

  try {
    const htmlContent = `
      <h2>New Class Submission - Parent Helper Directory</h2>
      
      <h3>Business Information</h3>
      <p><strong>Business Name:</strong> ${params.businessName}</p>
      <p><strong>Contact Name:</strong> ${params.contactName}</p>
      <p><strong>Email:</strong> ${params.email}</p>
      <p><strong>Phone:</strong> ${params.phone}</p>
      <p><strong>Website:</strong> ${params.website || 'Not provided'}</p>
      <p><strong>Social Media:</strong> ${params.socialMedia || 'Not provided'}</p>
      
      <h3>Class Details</h3>
      <p><strong>Class Name:</strong> ${params.className}</p>
      <p><strong>Description:</strong> ${params.description}</p>
      <p><strong>Age Range:</strong> ${params.ageRange}</p>
      <p><strong>Day & Time:</strong> ${params.dayTime}</p>
      <p><strong>Cost:</strong> ${params.cost}</p>
      <p><strong>Postcode:</strong> ${params.postcode}</p>
      
      <hr>
      <p><em>This submission was received through the Parent Helper "List Your Class" form.</em></p>
    `;

    const textContent = `
New Class Submission - Parent Helper Directory

Business Information:
- Business Name: ${params.businessName}
- Contact Name: ${params.contactName}
- Email: ${params.email}
- Phone: ${params.phone}
- Website: ${params.website || 'Not provided'}
- Social Media: ${params.socialMedia || 'Not provided'}

Class Details:
- Class Name: ${params.className}
- Description: ${params.description}
- Age Range: ${params.ageRange}
- Day & Time: ${params.dayTime}
- Cost: ${params.cost}
- Postcode: ${params.postcode}

This submission was received through the Parent Helper "List Your Class" form.
    `;

    await mailService.send({
      to: 'notification@parenthelper.co.uk',
      from: 'notification@parenthelper.co.uk',
      replyTo: 'notification@parenthelper.co.uk',
      subject: `New Class Submission: ${params.className} - ${params.businessName}`,
      text: textContent,
      html: htmlContent,
    });
    
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}