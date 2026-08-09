import {
  sendPasswordResetEmail,
  sendPasswordChangedConfirmationEmail,
  sendVerificationEmail,
  sendGroupInvitationEmail
} from '../src/services/emailService.js';

process.env.NODE_ENV = 'test';
process.env.MOCK_EMAIL = 'true';

let passedCount = 0;
let failedCount = 0;
const totalCases = 7;

function logTest(testNum, title, passed, detail = '') {
  if (passed) {
    passedCount++;
    console.log(`✅ TEST ${testNum}/${totalCases}: ${title} - PASSED ${detail}`);
  } else {
    failedCount++;
    console.log(`❌ TEST ${testNum}/${totalCases}: ${title} - FAILED ${detail}`);
  }
}

async function runEmailAudit() {
  console.log('\n==================================================');
  console.log('📧 RUNNING SPENDPILOT EMAIL DELIVERY AUDIT TEST SUITE');
  console.log('==================================================\n');

  // Test A: User A Password Reset -> Dynamic Recipient User A
  try {
    const userA = 'usera_test_email@example.com';
    const resA = await sendPasswordResetEmail({ to: userA, resetToken: 'token_a', userName: 'User A' });
    const passA = resA && resA.recipient === userA.toLowerCase();
    logTest(1, 'User A Password Reset Email Target', passA, `(Recipient: ${resA.recipient})`);
  } catch (err) {
    logTest(1, 'User A Password Reset Email Target', false, err.message);
  }

  // Test B: User B Password Reset -> Dynamic Recipient User B
  try {
    const userB = 'userb_test_email@example.com';
    const resB = await sendPasswordResetEmail({ to: userB, resetToken: 'token_b', userName: 'User B' });
    const passB = resB && resB.recipient === userB.toLowerCase();
    logTest(2, 'User B Password Reset Email Target', passB, `(Recipient: ${resB.recipient})`);
  } catch (err) {
    logTest(2, 'User B Password Reset Email Target', false, err.message);
  }

  // Test C: Group Invitation -> Dynamic Recipient Invitee
  try {
    const inviteeEmail = 'invitee_member@example.com';
    const resInvite = await sendGroupInvitationEmail({
      to: inviteeEmail,
      inviterName: 'Rahul',
      groupName: 'Goa Trip 2026',
      groupId: 'grp-goa-123'
    });
    const passInvite = resInvite && resInvite.recipient === inviteeEmail.toLowerCase();
    logTest(3, 'Group Invitation Email Target', passInvite, `(Recipient: ${resInvite.recipient})`);
  } catch (err) {
    logTest(3, 'Group Invitation Email Target', false, err.message);
  }

  // Test D: Password Changed Confirmation -> Dynamic Recipient User
  try {
    const userC = 'userc_changed@example.com';
    const resConfirm = await sendPasswordChangedConfirmationEmail({ to: userC, userName: 'User C' });
    const passConfirm = resConfirm && resConfirm.recipient === userC.toLowerCase();
    logTest(4, 'Password Changed Confirmation Target', passConfirm, `(Recipient: ${resConfirm.recipient})`);
  } catch (err) {
    logTest(4, 'Password Changed Confirmation Target', false, err.message);
  }

  // Test E: Email verification is intentionally disabled.
  try {
    const newlyRegistered = 'new_registered_user@example.com';
    const resVer = await sendVerificationEmail({
      to: newlyRegistered,
      userName: 'New User',
      verificationToken: 'ver_999'
    });
    const passVer = resVer && resVer.success === false && resVer.error === 'Email verification is disabled.';
    logTest(5, 'Account Verification Email Disabled', passVer);
  } catch (err) {
    logTest(5, 'Account Verification Email Disabled', false, err.message);
  }

  // Test F: Missing Recipient Error Handling
  try {
    const resMissing = await sendPasswordResetEmail({ to: '', resetToken: 'abc' }).catch(err => ({ success: false, error: err.message }));
    const passMissing = resMissing && resMissing.success === false;
    logTest(6, 'Missing Recipient Error Handled', passMissing, `(Result: ${resMissing.error})`);
  } catch (err) {
    logTest(6, 'Missing Recipient Error Handled', false, err.message);
  }

  // Test G: Resend Sandbox Account Delivery Verification (Test account)
  try {
    const testAccount = 'test_owner@spendpilot.com';
    const resOwner = await sendPasswordResetEmail({ to: testAccount, resetToken: 'owner_token', userName: 'Owner' });
    const passOwner = resOwner && resOwner.recipient === testAccount.toLowerCase();
    logTest(7, 'Email Service Target Resolution for Test Account', passOwner, `(Recipient: ${resOwner.recipient})`);
  } catch (err) {
    logTest(7, 'Email Service Target Resolution for Test Account', false, err.message);
  }

  console.log('\n==================================================');
  console.log(`📊 FINAL EMAIL AUDIT RESULTS: ${passedCount}/${totalCases} PASSED`);
  console.log('==================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runEmailAudit();
