const Airtable = require('airtable');

const token = 'patUmtejVE5l6Lbr7.ec8bcb286d09182ff263889564a7948f02045b359816d0d8a1c175a4d4e96f93';
const baseId = 'app9eOTFWck1sZwTG';

const base = new Airtable({
  apiKey: token
}).base(baseId);

const table = base('tblDcOhMjN0kb8dk4');

function isPostcode(text) {
  if (!text) return false;
  return /^[A-Z]{1,2}[0-9R][0-9A-Z]? [0-9][ABD-HJLNP-UW-Z]{2}$/i.test(text.trim());
}

function isFeaturedValue(text) {
  if (!text) return false;
  return text.toString().toLowerCase() === 'featured' || text.toString().toLowerCase() === 'true';
}

function isPhoneNumber(text) {
  if (!text) return false;
  return /^[\+]?[0-9\s\-\(\)]{10,}$/.test(text.trim());
}

function isEmail(text) {
  if (!text) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text.trim());
}

function isWebsite(text) {
  if (!text) return false;
  return /^https?:\/\/|www\./i.test(text.trim());
}

async function fixMisalignedData() {
  try {
    console.log('🔍 Scanning for misaligned data in Airtable...');

    let totalRecords = 0;
    let fixedRecords = 0;
    let issues = [];

    await table.select({
      pageSize: 100
    }).eachPage(async (records, fetchNextPage) => {
      
      for (const record of records) {
        totalRecords++;
        const fields = record.fields;
        const recordId = record.id;
        const businessName = fields['Business_Name'] || 'Unknown Business';
        
        let needsUpdate = false;
        let updates = {};
        let recordIssues = [];

        // Check Postcode column for non-postcode data
        if (fields['Postcode'] && !isPostcode(fields['Postcode'])) {
          const postcodeValue = fields['Postcode'];
          recordIssues.push(`Postcode column contains: "${postcodeValue}"`);
          
          // Try to identify what this data actually is
          if (isFeaturedValue(postcodeValue)) {
            updates['Featured'] = true;
            updates['Postcode'] = '';
            recordIssues.push(`→ Moving "featured" to Featured column`);
          } else if (isPhoneNumber(postcodeValue)) {
            updates['Phone'] = postcodeValue;
            updates['Postcode'] = '';
            recordIssues.push(`→ Moving phone to Phone column`);
          } else if (isEmail(postcodeValue)) {
            updates['Email'] = postcodeValue;
            updates['Postcode'] = '';
            recordIssues.push(`→ Moving email to Email column`);
          } else if (isWebsite(postcodeValue)) {
            updates['Website'] = postcodeValue;
            updates['Postcode'] = '';
            recordIssues.push(`→ Moving website to Website column`);
          }
          needsUpdate = true;
        }

        // Check Phone column for non-phone data
        if (fields['Phone'] && !isPhoneNumber(fields['Phone'])) {
          const phoneValue = fields['Phone'];
          recordIssues.push(`Phone column contains: "${phoneValue}"`);
          
          if (isPostcode(phoneValue)) {
            updates['Postcode'] = phoneValue;
            updates['Phone'] = '';
            recordIssues.push(`→ Moving postcode to Postcode column`);
          } else if (isEmail(phoneValue)) {
            updates['Email'] = phoneValue;
            updates['Phone'] = '';
            recordIssues.push(`→ Moving email to Email column`);
          } else if (isWebsite(phoneValue)) {
            updates['Website'] = phoneValue;
            updates['Phone'] = '';
            recordIssues.push(`→ Moving website to Website column`);
          }
          needsUpdate = true;
        }

        // Check Email column for non-email data
        if (fields['Email'] && !isEmail(fields['Email'])) {
          const emailValue = fields['Email'];
          recordIssues.push(`Email column contains: "${emailValue}"`);
          
          if (isPostcode(emailValue)) {
            updates['Postcode'] = emailValue;
            updates['Email'] = '';
            recordIssues.push(`→ Moving postcode to Postcode column`);
          } else if (isPhoneNumber(emailValue)) {
            updates['Phone'] = emailValue;
            updates['Email'] = '';
            recordIssues.push(`→ Moving phone to Phone column`);
          } else if (isWebsite(emailValue)) {
            updates['Website'] = emailValue;
            updates['Email'] = '';
            recordIssues.push(`→ Moving website to Website column`);
          }
          needsUpdate = true;
        }

        // Check Website column for non-website data
        if (fields['Website'] && !isWebsite(fields['Website'])) {
          const websiteValue = fields['Website'];
          recordIssues.push(`Website column contains: "${websiteValue}"`);
          
          if (isPostcode(websiteValue)) {
            updates['Postcode'] = websiteValue;
            updates['Website'] = '';
            recordIssues.push(`→ Moving postcode to Postcode column`);
          } else if (isPhoneNumber(websiteValue)) {
            updates['Phone'] = websiteValue;
            updates['Website'] = '';
            recordIssues.push(`→ Moving phone to Phone column`);
          } else if (isEmail(websiteValue)) {
            updates['Email'] = websiteValue;
            updates['Website'] = '';
            recordIssues.push(`→ Moving email to Email column`);
          }
          needsUpdate = true;
        }

        if (needsUpdate && Object.keys(updates).length > 0) {
          try {
            await table.update(recordId, updates);
            console.log(`\n✅ Fixed: ${businessName} (Row ${totalRecords})`);
            recordIssues.forEach(issue => console.log(`   ${issue}`));
            fixedRecords++;
          } catch (error) {
            console.log(`❌ Error fixing ${businessName}: ${error.message}`);
          }
          
          // Small delay to respect API limits
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        if (recordIssues.length > 0) {
          issues.push({
            row: totalRecords,
            business: businessName,
            issues: recordIssues
          });
        }
      }
      
      fetchNextPage();
    });

    console.log(`\n📊 MISALIGNED DATA CLEANUP COMPLETE:`);
    console.log(`Total records scanned: ${totalRecords}`);
    console.log(`Records with issues fixed: ${fixedRecords}`);
    console.log(`Issues found and corrected: ${issues.length}`);
    
    if (issues.length > 0) {
      console.log(`\n🔧 Summary of fixes applied:`);
      issues.slice(0, 10).forEach(issue => {
        console.log(`Row ${issue.row}: ${issue.business}`);
        issue.issues.forEach(i => console.log(`  ${i}`));
      });
      
      if (issues.length > 10) {
        console.log(`... and ${issues.length - 10} more records fixed`);
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

fixMisalignedData();