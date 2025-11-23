import http from 'http';
import { Application } from 'express';
import app from './app';
import { config } from './config';
import { logger } from './config/logger'; // Updated import path
import PrismaService from './infrastructure/database/prisma.service'; // Using PrismaService from infrastructure
import chalk from 'chalk';

/**
 * Custom gradient function using chalk hex colors
 */
const createGradient = (text: string, colors: string[]): string => {
  if (text.length === 0) return text;
  const steps = text.length;
  const colorSteps = colors.length - 1;
  let result = '';

  for (let i = 0; i < steps; i++) {
    const position = (i / steps) * colorSteps;
    const colorIndex = Math.floor(position);
    const color = colors[colorIndex];
    result += chalk.hex(color)(text[i]);
  }

  return result;
};

/**
 * Gradient color schemes
 */
const gradientSchemes = {
  primary: ['#667eea', '#764ba2', '#f093fb'],
  info: ['#4facfe', '#00f2fe'],
  accent: ['#30cfd0', '#330867'],
};

/**
 * Strip ANSI codes to get real string length
 */
const stripAnsi = (str: string): string => {
  return str.replace(/\x1b\[[0-9;]*m/g, '');
};

/**
 * Get real display length
 */
const realLength = (str: string): number => {
  return stripAnsi(str).length;
};

/**
 * Pad string to exact width
 */
const padToWidth = (
  str: string,
  width: number,
  align: 'left' | 'center' | 'right' = 'center'
): string => {
  const len = realLength(str);
  const padding = Math.max(0, width - len);

  if (align === 'left') {
    return str + ' '.repeat(padding);
  } else if (align === 'right') {
    return ' '.repeat(padding) + str;
  } else {
    const leftPad = Math.floor(padding / 2);
    const rightPad = padding - leftPad;
    return ' '.repeat(leftPad) + str + ' '.repeat(rightPad);
  }
};

/**
 * Create HTTP Server
 */
export const createServer = (app: Application): http.Server => {
  const server = http.createServer(app);

  const gracefulShutdown = async (signal: string) => {
    logger.info(`${signal} received. Starting graceful shutdown...`);

    server.close(async () => {
      logger.info('HTTP server closed');

      try {
        const prisma = PrismaService.getInstance();
        await prisma.disconnect();
        logger.info('All connections closed. Exiting...');
        process.exit(0);
      } catch (error) {
        logger.error('Error during shutdown:', error);
        process.exit(1);
      }
    });

    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 30000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    gracefulShutdown('uncaughtException');
  });
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown('unhandledRejection');
  });

  return server;
};

/**
 * Start Server
 */
export const startServer = async (server: http.Server): Promise<void> => {
  try {
    const prisma = PrismaService.getInstance();
    await prisma.connect();

    server.listen(config.port, () => {
      // Use 100% of terminal width
      const cols = process.stdout.columns || 100;
      const width = cols; // Full width
      const inner = width - 2; // Inner content width (minus 2 border chars)

      // Border colors - use single characters consistently
      const BL = chalk.hex('#667eea');
      const BR = chalk.hex('#f093fb');
      const AL = chalk.hex('#30cfd0');
      const AR = chalk.hex('#330867');

      // Create simple non-gradient lines for perfect alignment
      const topBorder = BL('┏' + '━'.repeat(inner) + '┓');
      const midBorder = AL('┣' + '─'.repeat(inner) + '┫');
      const botBorder = BL('┗' + '━'.repeat(inner) + '┛');

      // Helper to create a line
      const line = (content: string, leftBorder = BL, rightBorder = BR) => {
        return leftBorder('┃') + padToWidth(content, inner, 'center') + rightBorder('┃');
      };

      // Empty line
      const empty = line('');

      // Logo
      const logo = [
        '  ██████╗ ██████╗ ██████╗ ███████╗███████╗███████╗███████╗████████╗',
        ' ██╔════╝██╔═══██╗██╔══██╗██╔════╝╚══███╔╝██╔════╝██╔════╝╚══██╔══╝',
        ' ██║     ██║   ██║██║  ██║█████╗    ███╔╝ █████╗  ███████╗   ██║   ',
        ' ██║     ██║   ██║██║  ██║██╔══╝   ███╔╝  ██╔══╝  ╚════██║   ██║   ',
        ' ╚██████╗╚██████╔╝██████╔╝███████╗███████╗███████╗███████║   ██║   ',
        '  ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝╚══════╝╚══════╝╚══════╝   ╚═╝   ',
      ].map((l) => line(createGradient(l, gradientSchemes.primary)));

      // Title
      const dot = chalk.hex('#38ef7d')('●');
      const title = line(
        createGradient('CodeZest Auth Server', gradientSchemes.info) +
          ' ' +
          dot +
          ' ' +
          chalk.white('Online')
      );

      // Info section - left aligned within centered block
      const info = [
        { icon: '◆', label: 'Environment', value: config.env, color: '#fee140' },
        { icon: '◆', label: 'Node Version', value: process.version, color: '#38ef7d' },
        { icon: '◆', label: 'Port', value: config.port.toString(), color: '#00f2fe' },
        { icon: '◆', label: 'API Version', value: config.apiVersion, color: '#764ba2' },
        { icon: '◆', label: 'Health Check', value: 'GET /health', color: '#30cfd0' },
        {
          icon: '◆',
          label: 'Documentation',
          value: `http://localhost:${config.port}/api/docs`,
          color: '#4facfe',
        },
        { icon: '◆', label: 'Started At', value: new Date().toLocaleString(), color: '#888888' },
      ];

      const maxLabel = Math.max(...info.map((i) => i.label.length));

      // Build info rows as left-aligned text
      const infoRows = info.map(({ icon, label, value, color }) => {
        return `  ${chalk.hex(color)(icon)} ${chalk.white.bold(label.padEnd(maxLabel))} ${chalk.dim('│')} ${chalk.hex(color)(value)}`;
      });

      // Find the longest info row
      const maxInfoWidth = Math.max(...infoRows.map((r) => realLength(r)));

      // Center the entire info block, then each row is already left-aligned within it
      const infoLines = infoRows.map((row) => {
        // Pad row to maxInfoWidth so all rows are same width
        const paddedRow = row + ' '.repeat(maxInfoWidth - realLength(row));
        // Now center this block
        const totalPad = inner - realLength(paddedRow);
        const leftPad = Math.floor(totalPad / 2);
        const rightPad = totalPad - leftPad;
        return BL('┃') + ' '.repeat(leftPad) + paddedRow + ' '.repeat(rightPad) + BR('┃');
      });

      // Ready
      const check = chalk.hex('#38ef7d')('✓');
      const ready = line(
        check +
          ' ' +
          chalk.white.bold('Ready') +
          ' ' +
          chalk.dim('— Server is running and accepting connections')
      );

      // Footer
      const footer = line(chalk.dim('Press Ctrl+C to stop the server'));

      // Assemble
      const banner = [
        '',
        topBorder,
        empty,
        ...logo,
        empty,
        midBorder,
        title,
        midBorder,
        empty,
        ...infoLines,
        empty,
        midBorder,
        ready,
        empty,
        footer,
        botBorder,
        '',
      ].join('\n');

      console.log(banner);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Call startServer with the created app
startServer(createServer(app));
