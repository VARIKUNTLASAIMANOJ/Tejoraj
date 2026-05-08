# Tejoraj 🚀

An intelligent AI-powered space exploration and research platform featuring smart paper generation, real-time chat, NASA data integration, and a space-themed interface.


## Features ✨

- **AI-Powered Paper Generation**: Generate structured research papers with AI assistance using LLM agents
- **Multiple Export Formats**: Export to PDF (with embedded figures) or DOC
- **Smart Title & Keywords**: Auto-generate paper titles and keywords from topic
- **Research Integration**: Built-in integration with arXiv and NASA APIs for sources and images
- **Real-time Chat**: Interactive chat interface for research discussion and Q&A
- **UI**: Space-themed interface with smooth animations and responsive design
- **Image Embedding**: Automatic fetching and embedding of NASA images in PDFs

## Tech Stack 🛠️

### Frontend
- **React 19** - UI library
- **Vite** - Build tool
- **Framer Motion** - Animations
- **TailwindCSS** - Styling
- **Lucide React** - Icons
- **html2pdf.js** - PDF generation (client-side)

### Backend
- **FastAPI** - Python web framework
- **Uvicorn** - ASGI server
- **Pydantic** - Data validation
- **LangChain** - LLM integration with Ollama
- **ReportLab** - Server-side PDF generation with image embedding
- **Pillow** - Image processing

### APIs & Services
- **Supabase** - Authentication & database
- **NASA Images API** - Research figure sourcing
- **arXiv API** - Citation and research papers
- **Spaceflight News API** - Space news integration
- **Ollama** - Local LLM inference

### DevOps
- **Docker & Docker Compose** - Containerization
- **Git** - Version control

## Project Structure 📁

```
SpaceAgent/
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/      # Reusable React components
│   │   ├── pages/           # Page components
│   │   ├── api/             # API client functions
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── .gitignore
├── backend/                  # FastAPI application
│   ├── app/
│   │   ├── api/             # API routes
│   │   ├── services/        # Business logic
│   │   ├── models/          # Pydantic models
│   │   ├── agents/          # LangChain agents
│   │   ├── tools/           # Tool integrations
│   │   └── main.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .gitignore
├── docker-compose.yml
├── .gitignore
└── README.md
```

## Getting Started 🚀

### Prerequisites
- Node.js 18+ (frontend)
- Python 3.10+ (backend)
- Docker & Docker Compose (optional)
- Ollama with a language model (or access to a remote LLM)

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173`

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set environment variables
cp .env.example .env  # Create from template
# Edit .env with your API keys and configuration

# Run the server
python -m uvicorn app.main:app --reload
```

The backend API will be available at `http://localhost:8000`

### Environment Variables

Create a `.env` file in the backend directory:

```env
# Database
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key

# APIs
NASA_API_KEY=your_nasa_api_key

# LLM
OLLAMA_BASE_URL=http://localhost:11434
LLM_MODEL=mistral  # or your preferred model

# App
APP_ENV=development
DEBUG=True
```

### Docker Compose (Optional)

```bash
docker-compose up
```

This will start both frontend and backend services.

## Usage 💡

1. **Create a Research Paper**
   - Enter a research topic
   - AI generates structured sections (Introduction, Methodology, Results, etc.)
   - Edit and customize each section

2. **Add Authors & Keywords**
   - Manually add or auto-generate keywords
   - Add multiple authors to the paper

3. **Generate Content**
   - Click "Generate" to create individual sections
   - AI pulls from arXiv and NASA APIs for sources

4. **Export**
   - **PDF**: Professional PDF with embedded NASA figures
   - **DOC**: Microsoft Word format for further editing
   - **LaTeX**: Raw LaTeX source for academic submissions

5. **Chat Interface**
   - Ask questions about research topics
   - Get real-time responses powered by AI agents

## API Endpoints 📡

### Research Paper
- `POST /api/research/generate` - Generate complete paper
- `POST /api/research/section` - Generate single section
- `POST /api/research/export` - Export as HTML/LaTeX
- `POST /api/research/export/pdf` - Export as PDF with images

### Chat
- `POST /chat` - Send chat message
- `GET /history` - Get chat history

### Explorer
- `GET /api/explorer/apod` - Astronomy Picture of the Day
- `GET /api/explorer/gallery` - NASA image gallery search
- `GET /api/explorer/news` - Space news feed

## Development 🔧

### Adding New Features
1. Backend: Add routes in `backend/app/api/`
2. Frontend: Create components in `frontend/src/components/`
3. Test locally before pushing
4. Follow existing code style and patterns

### Running Tests
```bash
# Backend
cd backend
pytest

# Frontend
cd frontend
npm run test
```

## Deployment 🌐

### Vercel (Frontend)
```bash
npm run build
# Deploy the `dist/` folder to Vercel
```

### Render or Railway (Backend)
1. Push to GitHub
2. Connect repository to Render/Railway
3. Set environment variables
4. Deploy

See `DEPLOYMENT.md` for detailed instructions.

## Contributing 🤝

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License 📝

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments 🙏

- NASA for their APIs and image resources
- arXiv for research paper data
- Spaceflight News API
- The LangChain and Ollama communities

## Support 💬

For issues, questions, or suggestions, please open an issue on GitHub.

