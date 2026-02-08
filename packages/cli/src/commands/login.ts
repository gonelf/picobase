import inquirer from 'inquirer';
import { api } from '../api';
import { config } from '../config';
import { success, error, spinner } from '../utils';

export async function loginCommand(): Promise<void> {
  try {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'email',
        message: 'Email:',
        validate: (input) => {
          if (!input || !input.includes('@')) {
            return 'Please enter a valid email address';
          }
          return true;
        },
      },
      {
        type: 'password',
        name: 'password',
        message: 'Password:',
        mask: '*',
        validate: (input) => {
          if (!input || input.length < 1) {
            return 'Password is required';
          }
          return true;
        },
      },
    ]);

    const spin = spinner('Authenticating...');

    try {
      const token = await api.login(answers.email, answers.password);
      config.setAuthToken(token);
      spin.succeed('Successfully logged in!');
      success('You can now create and manage instances.');
    } catch (err: any) {
      spin.fail('Authentication failed');
      if (err.response?.status === 401) {
        error('Invalid email or password');
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
