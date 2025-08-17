# NoteSummary AI

An AI-powered meeting notes summarizer and sharer built with React, Express, and Groq AI.

## Features

- **Upload Transcripts**: Paste meeting notes or call transcripts
- **Custom Instructions**: Provide specific summarization prompts
- **AI Summarization**: Powered by Groq's fast LLM inference
- **Editable Results**: Review and edit AI-generated summaries
- **Email Sharing**: Share summaries with team members via email

## Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Get your API keys and add them to your `.env` file:

**Required:**
```
GROQ_API_KEY=your_groq_api_key_here
```
Get your Groq API key from [https://console.groq.com/keys](https://console.groq.com/keys)

**Optional (for real email sending):**
```
RESEND_API_KEY=your_resend_api_key_here
```
Get your Resend API key from [https://resend.com/api-keys](https://resend.com/api-keys)

> **Note:** If `RESEND_API_KEY` is not configured, email sharing will run in simulation mode (no actual emails sent).

### 3. Start Development Server

```bash
pnpm run dev
```

The application will be available at `http://localhost:8080`

## Usage

1. **Input**: Paste your meeting transcript in the text area
2. **Customize**: Optionally modify the summarization instructions
3. **Generate**: Click "Generate Summary" to create an AI summary
4. **Edit**: Review and edit the generated summary as needed
5. **Share**: Enter email addresses to share the summary with your team

## Tech Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS + Radix UI
- **Backend**: Express.js + Node.js
- **AI**: Groq API (llama-3.1-8b-instant)
- **Development**: Vite + PNPM

## API Endpoints

- `POST /api/generate-summary` - Generate AI summary from transcript
- `POST /api/share-summary` - Share summary via email (simulated)

## Contributing

This is a demo application showcasing AI integration with modern web development practices. Feel free to extend it with additional features like:

- Real email integration (SendGrid, Mailgun, etc.)
- User authentication
- Summary history and management
- Export to different formats (PDF, Word, etc.)
- Real-time collaboration
