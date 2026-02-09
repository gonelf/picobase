import inquirer from 'inquirer';
import { api } from '../api';
import { config } from '../config';
import { success, error, spinner, info } from '../utils';

export async function loginCommand(): Promise<void> {
  try {
    const { email } = await inquirer.prompt([
      {
        type: 'input',
        name: 'email',
        message: 'Enter your email:',
        validate: (input) => {
          if (!input || !input.includes('@')) {
            return 'Please enter a valid email address';
          }
          return true;
        },
      },
    ]);

    const requestSpin = spinner('Sending login code...');

    try {
      // 1. Request OTP
      const { deviceId, preAuthSessionId } = await api.passwordlessLoginStart(email);
      requestSpin.succeed(`Login code sent to ${email}`);

      // 2. Prompt for OTP
      const { code } = await inquirer.prompt([
        {
          type: 'input',
          name: 'code',
          message: 'Enter the 6-digit code from your email:',
          validate: (input) => {
            if (!input || input.length !== 6) {
              return 'Please enter a 6-digit code';
            }
            return true;
          },
        },
      ]);

      const verifySpin = spinner('Verifying code...');

      // 3. Verify OTP
      const token = await api.passwordlessLoginConsume(preAuthSessionId, deviceId, code);
      config.setAuthToken(token);
      verifySpin.succeed('Successfully logged in!');

      success('You can now create and manage instances.');
      info('Try running: picobase create <name>');

    } catch (err: any) {
      if (requestSpin.isSpinning) requestSpin.fail('Failed to request login code');

      if (err.response?.data?.message) {
        error(err.response.data.message);
      } else {
        error(err.message || 'An error occurred during login');
      }
      process.exit(1);
    }
  } catch (err: any) {
    error(err.message || 'An error occurred');
    process.exit(1);
  }
}
