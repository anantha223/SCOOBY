/* Minimal Express server for demo (Node 18+) */
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import nodemailer from 'nodemailer';

const __dirname = path.resolve();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/static', express.static(path.join(__dirname, 'uploads')));

// Multer setup for file uploads
const upload = multer({ dest: 'uploads/' });

// Simple in-memory "DB" (for demo only)
const institutes = [];
const users = [];

// Login endpoint (demo)
app.post('/api/login', (req, res) => {
  const { email } = req.body;
  if(!email) return res.json({ ok:false, error:'Email required' });
  const user = { id: Date.now(), email };
  users.push(user);
  return res.json({ ok:true, user });
});

// Institute register (with file uploads)
app.post('/api/institute/register', upload.fields([{ name: 'proof' }, { name: 'degree' }]), (req, res) => {
  const { name, email } = req.body;
  if(!name || !email) return res.json({ error:'Name and email required' });
  const rec = { id: Date.now(), name, email, files: req.files };
  institutes.push(rec);
  // send notification email (demo) - NOTE: configure env for real sending
  // Here we'll attempt to send using SMTP if env vars set, otherwise just respond.
  if(process.env.SMTP_HOST){
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });
    transporter.sendMail({
      from: process.env.SMTP_FROM || 'no-reply@scooby.local',
      to: email,
      subject: 'Institute Registration Received',
      text: `Hello ${name}, your registration has been received.`
    }).catch(e=>console.error('mail fail',e));
  }
  res.json({ message:'Institute registered (demo). Check backend logs for files. Email may go to spam depending on SMTP settings.' });
});

app.post('/api/proctor/warning', (req, res) => {
  console.log('Proctor warning received', req.body);
  return res.json({ ok:true });
});

// AI mock endpoints
app.post('/api/ai/chat', (req, res) => {
  const { prompt } = req.body;
  return res.json({ reply: 'This is a demo AI chat response for prompt: ' + (prompt || '') });
});

app.post('/api/ai/image', (req, res) => {
  const { prompt } = req.body;
  // return a placeholder data URL or remote image URL in real integration
  return res.json({ data: ['https://via.placeholder.com/800x400.png?text=' + encodeURIComponent(prompt || 'AI+Image')] });
});

// file upload endpoint for pro_final
app.post('/api/pro_final/upload', upload.single('project'), (req, res) => {
  if(!req.file) return res.json({ error:'No file' });
  // move or process file here. For demo we just return success with path
  res.json({ ok:true, path: req.file.path });
});

// Simple endpoint to list institutes for host (demo)
app.get('/api/institutes', (req, res) => {
  res.json({ institutes });
});

// static file serving for frontend in production (optional)
app.use(express.static(path.join(__dirname, 'frontend')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>console.log('Server running on', PORT));