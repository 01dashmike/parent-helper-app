import { MailService } from '@sendgrid/mail';
import type { Provider, ProviderClaim, FranchiseInvite } from "@shared/schema";

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

interface ClaimListingEmailParams {
  classId: number;
  className: string;
  fullName: string;
  email: string;
  role: string;
  phone?: string;
  website?: string;
  proofUrl?: string;
  message: string;
  contactPreference: "email" | "phone";
}

export async function sendClaimListingNotification(
  params: ClaimListingEmailParams,
): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.log("SendGrid API key not configured, skipping claim notification email");
    return false;
  }

  try {
    const htmlContent = `
      <h2>New Listing Claim Request</h2>

      <p><strong>Class ID:</strong> ${params.classId}</p>
      <p><strong>Class Name:</strong> ${params.className}</p>

      <h3>Claimant Details</h3>
      <p><strong>Name:</strong> ${params.fullName}</p>
      <p><strong>Email:</strong> ${params.email}</p>
      <p><strong>Role:</strong> ${params.role}</p>
      <p><strong>Preferred Contact:</strong> ${params.contactPreference}</p>
      <p><strong>Phone:</strong> ${params.phone || "Not provided"}</p>
      <p><strong>Website:</strong> ${params.website || "Not provided"}</p>
      <p><strong>Proof URL:</strong> ${params.proofUrl || "Not provided"}</p>

      <h3>Message</h3>
      <p>${params.message}</p>

      <hr />
      <p><em>This request was submitted via the Parent Helper "Claim this listing" form.</em></p>
    `;

    const textContent = `
New Listing Claim Request

Class ID: ${params.classId}
Class Name: ${params.className}

Claimant Details:
- Name: ${params.fullName}
- Email: ${params.email}
- Role: ${params.role}
- Preferred Contact: ${params.contactPreference}
- Phone: ${params.phone || "Not provided"}
- Website: ${params.website || "Not provided"}
- Proof URL: ${params.proofUrl || "Not provided"}

Message:
${params.message}

This request was submitted via the Parent Helper "Claim this listing" form.
    `;

    await mailService.send({
      to: "notification@parenthelper.co.uk",
      from: "notification@parenthelper.co.uk",
      replyTo: params.email,
      subject: `Listing Claim: ${params.className} (#${params.classId})`,
      text: textContent,
      html: htmlContent,
    });

    return true;
  } catch (error) {
    console.error("SendGrid claim email error:", error);
    return false;
  }
}

interface ProviderClaimAdminParams {
  provider: Provider;
  claim: ProviderClaim;
  autoApprove: boolean;
  franchiseName?: string;
}

export async function sendProviderClaimAdminNotification(
  params: ProviderClaimAdminParams,
): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.log("SendGrid API key not configured, skipping provider claim admin email");
    return false;
  }

  try {
    const htmlContent = `
      <h2>Provider Claim Submitted</h2>

      <h3>Provider</h3>
      <p><strong>Name:</strong> ${params.provider.name}</p>
      ${params.franchiseName ? `<p><strong>Franchise:</strong> ${params.franchiseName}</p>` : ""}
      <p><strong>Town:</strong> ${params.provider.town ?? 'Unknown'}</p>
      <p><strong>Postcode:</strong> ${params.provider.postcode ?? 'Unknown'}</p>

      <h3>Claimant</h3>
      <p><strong>Name:</strong> ${params.claim.claimantName}</p>
      <p><strong>Email:</strong> ${params.claim.claimantEmail}</p>
      <p><strong>Phone:</strong> ${params.claim.claimantPhone ?? 'Not provided'}</p>
      <p><strong>Relationship:</strong> ${params.claim.relationship}</p>
      <p><strong>Website:</strong> ${params.claim.website ?? 'Not provided'}</p>
      <p><strong>Proof:</strong> ${params.claim.proofUrl ?? 'Not provided'}</p>

      <h3>Notes</h3>
      <p>${params.claim.message ?? 'No message provided.'}</p>

      <hr />
      <p><strong>Status:</strong> ${params.autoApprove ? 'Auto-approved' : 'Pending review'}</p>
    `;

    const textContent = `
Provider Claim Submitted

- Name: ${params.provider.name}
${params.franchiseName ? `- Franchise: ${params.franchiseName}` : ""}
- Town: ${params.provider.town ?? 'Unknown'}
- Postcode: ${params.provider.postcode ?? 'Unknown'}

Claimant:
- Name: ${params.claim.claimantName}
- Email: ${params.claim.claimantEmail}
- Phone: ${params.claim.claimantPhone ?? 'Not provided'}
- Relationship: ${params.claim.relationship}
- Website: ${params.claim.website ?? 'Not provided'}
- Proof: ${params.claim.proofUrl ?? 'Not provided'}

Notes:
${params.claim.message ?? 'No message provided.'}

Status: ${params.autoApprove ? 'Auto-approved' : 'Pending review'}
    `;

    await mailService.send({
      to: process.env.CLAIM_REVIEW_EMAIL || "notification@parenthelper.co.uk",
      from: "notification@parenthelper.co.uk",
      replyTo: params.claim.claimantEmail,
      subject: `Provider Claim: ${params.provider.name}`,
      text: textContent,
      html: htmlContent,
    });

    return true;
  } catch (error) {
    console.error("SendGrid provider claim admin email error:", error);
    return false;
  }
}

interface ProviderClaimantEmailParams {
  provider: Provider;
  claim: ProviderClaim;
  franchiseName?: string;
}

export async function sendProviderClaimantConfirmation(
  params: ProviderClaimantEmailParams,
): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.log("SendGrid API key not configured, skipping provider claimant confirmation email");
    return false;
  }

  try {
    const htmlContent = `
      <h2>Thanks for claiming ${params.provider.name}</h2>
      <p>Hi ${params.claim.claimantName},</p>
      <p>We have received your request to claim the listing for <strong>${params.provider.name}</strong>${params.franchiseName ? ` (franchise: ${params.franchiseName})` : ""}.</p>
      <p>Our team will review your submission and get back to you within 2 business days.</p>
      <p>If you submitted this request in error, simply ignore this message.</p>
      <p>Thanks!<br/>Parent Helper Team</p>
    `;

    const textContent = `Hi ${params.claim.claimantName},

We have received your request to claim the listing for ${params.provider.name}${params.franchiseName ? ` (franchise: ${params.franchiseName})` : ""}.
Our team will review your submission and get back to you within 2 business days.

Thanks!
Parent Helper Team
    `;

    await mailService.send({
      to: params.claim.claimantEmail,
      from: "notification@parenthelper.co.uk",
      subject: `We've received your claim for ${params.provider.name}`,
      text: textContent,
      html: htmlContent,
    });

    return true;
  } catch (error) {
    console.error("SendGrid provider claimant confirmation email error:", error);
    return false;
  }
}

interface FranchiseInviteEmailParams {
  email: string;
  invite: FranchiseInvite;
  signupUrl: string;
}

export async function sendFranchiseInviteEmail(
  params: FranchiseInviteEmailParams,
): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.log("SendGrid API key not configured, skipping franchise invite email");
    return false;
  }

  try {
    const htmlContent = `
      <h2>Join Parent Helper</h2>
      <p>Hello!</p>
      <p>Your head office has invited you to manage your classes on Parent Helper.</p>
      <p>Use the link below to sign up and unlock your franchise discount.</p>
      <p><a href="${params.signupUrl}">Complete your signup</a></p>
      <p>If you weren't expecting this, you can ignore the email.</p>
    `;

    const textContent = `Your head office has invited you to Parent Helper. Open this link to get started: ${params.signupUrl}`;

    await mailService.send({
      to: params.email,
      from: "notification@parenthelper.co.uk",
      subject: "You're invited to Parent Helper",
      text: textContent,
      html: htmlContent,
    });

    return true;
  } catch (error) {
    console.error("SendGrid franchise invite email error:", error);
    return false;
  }
}
