 # SolveIt 🧮🤖

> A multimodal AI mathematics assistant built with React Native and Spring Boot, designed to process mathematical problems using direct text-to-LLM and multimodal AI capabilities.

## 📌 Overview

**SolveIt** is a multimodal AI application that helps users understand and solve mathematical problems using AI-generated, step-by-step solutions.

The project combines a **React Native frontend** with a **Spring Boot backend** and integrates AI models through **Ollama for local LLM inference** and the **Gemini API** for multimodal processing.

The architecture is designed to reduce dependency on traditional OCR-based pipelines by allowing mathematical content to be processed directly through AI models.

---

## ✨ Features

- 🤖 AI-powered mathematical problem solving
- 📝 Text-based mathematical queries
- 🖼️ Multimodal mathematical problem processing
- 📚 Step-by-step AI-generated solutions
- ⚡ Fast AI response pipeline
- 📱 Cross-platform React Native application
- ☁️ Spring Boot backend architecture
- 🧠 Local LLM support using Ollama
- 🌐 Gemini API integration
- 🔐 Backend API architecture for secure communication
- 📊 Designed with performance and scalability in mind
- 📱 Android physical-device support
- 🛠️ Custom Android build configuration

---

## 🏗️ System Architecture

```text
                    ┌───────────────────────┐
                    │      User            │
                    │  Mathematical Query  │
                    └───────────┬───────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │   React Native App   │
                    │                       │
                    │  • UI                │
                    │  • User Input        │
                    │  • Solution Display  │
                    └───────────┬───────────┘
                                │
                         REST API / Request
                                │
                                ▼
                    ┌───────────────────────┐
                    │    Spring Boot       │
                    │      Backend         │
                    │                       │
                    │  • API Layer         │
                    │  • Business Logic    │
                    │  • AI Integration    │
                    └───────────┬───────────┘
                                │
                     ┌──────────┴──────────┐
                     │                     │
                     ▼                     ▼
             ┌───────────────┐     ┌───────────────┐
             │    Ollama     │     │  Gemini API   │
             │               │     │               │
             │ Local LLM     │     │ Multimodal AI │
             └───────┬───────┘     └───────┬───────┘
                     │                     │
                     └──────────┬──────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │ AI Generated Solution │
                    │                       │
                    │ Step-by-step answer   │
                    └───────────┬───────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │   React Native UI    │
                    │                       │
                    │ Display Solution     │
                    └───────────────────────┘
