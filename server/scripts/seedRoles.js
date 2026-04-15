import dotenv from "dotenv";
dotenv.config();
import Role from "../models/Role.js";
import mongoose from "mongoose";
import { GoogleGenerativeAI } from "@google/generative-ai";

import { TaskType } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const popularRoles = [
  // --- Software & IT Engineering (Technical) ---
  { title: "Full Stack Developer", description: "Builds both front-end and back-end web applications. Skills: MERN stack, React, Node.js, Express, MongoDB, API design, system architecture." },
  { title: "Frontend Web Developer", description: "Develops user-facing web applications. Skills: React.js, Vue.js, Angular, HTML5, CSS3, Tailwind, TypeScript, UI/UX, responsive design." },
  { title: "Backend Software Engineer", description: "Builds scalable server-side logic and databases. Skills: Node.js, Python, Java, Go, C++, SQL, PostgreSQL, Redis, RESTful APIs, Microservices." },
  { title: "Software Engineer (Generalist)", description: "Designs and maintains complex software systems. Skills: Data Structures, Algorithms, Object-Oriented Programming, C++, Java, System Design." },
  { title: "iOS Developer", description: "Creates native mobile applications for Apple devices. Skills: Swift, Objective-C, Xcode, iOS SDK, CoreData, UIKit, SwiftUI." },
  { title: "Android Developer", description: "Creates native mobile applications for Android devices. Skills: Kotlin, Java, Android Studio, Android SDK, Jetpack Compose." },
  { title: "DevOps Engineer", description: "Bridges development and operations to streamline deployments. Skills: AWS, Azure, Docker, Kubernetes, CI/CD pipelines, Terraform, Linux." },
  { title: "Cloud Architect", description: "Designs comprehensive cloud environments and infrastructure. Skills: AWS/GCP/Azure architecture, Serverless computing, Cloud security, Cost optimization." },
  { title: "Site Reliability Engineer (SRE)", description: "Ensures highly scalable and reliable software systems by applying software engineering principles to infrastructure and operations." },
  { title: "Platform Engineer", description: "Builds and maintains the internal developer platform (IDP) to improve productivity and streamline toolchains for engineering teams." },
  { title: "Cloud FinOps Engineer", description: "Manages and optimizes cloud financial operations, analyzing spending and implementing cost-saving measures across cloud platforms." },
  { title: "Blockchain Developer", description: "Develops and implements decentralized applications (dApps) and smart contracts on blockchain platforms like Ethereum, Solana, and Hyperledger." },
  { title: "Smart Contract Auditor", description: "Reviews and analyzes smart contract code for security vulnerabilities, logic errors, and economic flaws before deployment." },
  { title: "Embedded Systems Engineer", description: "Designs and develops software for embedded devices and microcontrollers, often in industries like automotive, IoT, and consumer electronics." },
  { title: "Game Developer", description: "Creates video games for consoles, PC, and mobile platforms. Skills: Unity, Unreal Engine, C#, C++, 3D modeling, game physics." },
  { title: "AR/VR Developer", description: "Builds immersive experiences for augmented reality (AR) and virtual reality (VR) applications. Skills: Unity, Unreal Engine, ARKit, OpenXR." },
  { title: "Quantum Computing Scientist", description: "Researches and develops algorithms and software for quantum computers, focusing on applications in cryptography, optimization, and simulation." },
  { title: "Computer Vision Engineer", description: "Develops algorithms that enable computers to 'see' and interpret images and videos. Skills: OpenCV, PyTorch, TensorFlow, Deep Learning." },
  { title: "Natural Language Processing (NLP) Engineer", description: "Builds models and systems that understand and generate human language. Skills: Python, Transformers, BERT, spaCy, NLTK." },
  { title: "Robotics Software Engineer", description: "Develops the software that controls and operates robots, including perception, motion planning, and control systems. Skills: ROS, C++, Python." },
  { title: "Edge Computing Engineer", description: "Designs and implements computing systems that process data near the source of data generation, reducing latency and bandwidth usage." },
  { title: "Bioinformatics Scientist", description: "Applies computational techniques to analyze biological data, such as genomic sequences, protein structures, and cellular pathways." },
  { title: "GIS Developer", description: "Develops and maintains Geographic Information Systems (GIS) applications and databases for mapping, spatial analysis, and location intelligence." },
  { title: "Systems Integrator", description: "Ensures different IT systems, software, and hardware work together seamlessly within an organization. Involves planning, testing, and troubleshooting integrations." },

  // --- Data, AI, & Machine Learning ---
  { title: "Data Scientist", description: "Analyzes complex data to build predictive models and inform decisions. Skills: Python, Machine Learning, Pandas, NumPy, Scikit-learn, statistical modeling." },
  { title: "Data Engineer", description: "Builds infrastructure and pipelines for data generation and processing. Skills: SQL, ETL, Apache Spark, Hadoop, Kafka, Snowflake, Airflow." },
  { title: "Data Analyst", description: "Translates numbers and data into plain English to help businesses make decisions. Skills: SQL, Excel, Tableau, Power BI, Data Visualization." },
  { title: "Machine Learning Engineer", description: "Designs and deploys AI models into production. Skills: Python, TensorFlow, PyTorch, Deep Learning, Model Deployment, MLOps." },
  { title: "MLOps Engineer", description: "Manages the lifecycle of machine learning models in production, focusing on deployment, monitoring, and governance. Skills: Kubernetes, Docker, MLflow, Kubeflow." },
  { title: "AI Engineer", description: "Focuses on building, deploying, and scaling Large Language Models (LLMs) and custom AI systems for various applications." },
  { title: "AI/ML Architect", description: "Designs the overall structure and strategy for AI and ML systems, ensuring they meet business objectives and technical requirements." },
  { title: "AI Research Scientist", description: "Conducts fundamental research to advance the field of artificial intelligence, developing new algorithms and models. Skills: Deep learning theory, research publications." },
  { title: "AI Product Manager", description: "Leads the strategy, roadmap, and execution for AI-powered products, bridging the gap between business, design, and data science." },
  { title: "Prompt Engineer", description: "Designs, refines, and optimizes text prompts to elicit the best possible responses from generative AI models like LLMs." },
  { title: "AI Ethics and Governance Specialist", description: "Ensures AI systems are developed and used responsibly, addressing issues of bias, fairness, transparency, and compliance with regulations." },
  { title: "AI Forensic Analyst", description: "Uses AI and machine learning tools to investigate cyberattacks and data breaches, identifying patterns and reconstructing attack timelines." },
  { title: "Business Intelligence (BI) Developer", description: "Designs and builds systems for collecting, storing, and analyzing business data to support strategic decision-making." },
  { title: "Decision Scientist", description: "Applies advanced analytics and modeling to guide business decisions, often focusing on causal inference and experimentation." },
  { title: "Data Architect", description: "Defines the data management strategy for an organization, designing the blueprints for data storage, integration, and security." },
  { title: "Big Data Engineer", description: "Specializes in building and maintaining large-scale data processing systems using technologies like Hadoop, Spark, and Kafka." },
  { title: "Analytics Engineer", description: "Transforms raw data into well-defined, tested, and documented datasets for business intelligence and analysis, bridging data engineering and data analysis." },
  { title: "Data Annotator", description: "Labels and categorizes raw data (images, text, audio) to create high-quality training datasets for machine learning models." },
  { title: "Business Analyst", description: "Evaluates business processes and uncovers areas for improvement. Skills: Process mapping, Requirements gathering, SQL, Business Strategy." },

  // --- Cybersecurity ---
  { title: "Cybersecurity Analyst", description: "Protects IT infrastructure and monitors networks for security breaches. Skills: Network security, SIEM, Threat analysis, Incident response, Firewalls." },
  { title: "Security Architect", description: "Designs, builds, and oversees the implementation of network and computer security for an organization." },
  { title: "Penetration Tester (Ethical Hacker)", description: "Simulates cyberattacks on an organization's systems to identify and remediate security vulnerabilities." },
  { title: "Application Security (AppSec) Engineer", description: "Integrates security into the software development lifecycle (SDLC), performing code reviews and security testing." },
  { title: "Cloud Security Engineer", description: "Specializes in securing cloud computing environments like AWS, Azure, and GCP, managing identity access, and ensuring compliance." },
  { title: "Chief Information Security Officer (CISO)", description: "A senior-level executive responsible for establishing and maintaining the enterprise vision, strategy, and program to ensure information assets are protected." },
  { title: "Security Operations Center (SOC) Analyst", description: "Monitors security alerts and events 24/7, triaging and investigating potential threats to an organization." },
  { title: "Incident Response Consultant", description: "Provides expert assistance to organizations during and after a cybersecurity breach, helping contain damage and restore operations." },
  { title: "Cybersecurity Auditor", description: "Evaluates an organization's security policies, procedures, and controls to ensure they comply with internal and external regulations." },
  { title: "Cryptographer", description: "Designs and analyzes encryption algorithms and security protocols to protect sensitive information in transit and at rest." },
  { title: "Network Security Engineer", description: "Designs and manages network security infrastructure, including firewalls, VPNs, and intrusion detection/prevention systems." },

  // --- Quality Assurance & Testing ---
  { title: "QA Automation Engineer", description: "Writes scripts to automatically test software. Skills: Selenium, Cypress, Playwright, Jest, TestNG, Automated testing pipelines." },
  { title: "Manual QA Tester", description: "Manually tests software applications to identify bugs, usability issues, and ensure features meet requirements." },
  { title: "Performance Test Engineer", description: "Tests the speed, responsiveness, and stability of software under various workloads. Skills: JMeter, LoadRunner." },
  { title: "Security Test Engineer", description: "Specializes in identifying security vulnerabilities in software through dynamic and static testing methods." },
  { title: "Software Development Engineer in Test (SDET)", description: "A developer who builds and maintains test automation frameworks and tools to improve overall product quality." },

  // --- IT Operations & Support ---
  { title: "IT Support Specialist", description: "Provides technical assistance and support to end-users for hardware, software, and network issues." },
  { title: "System Administrator (SysAdmin)", description: "Maintains, configures, and ensures reliable operation of an organization's computer systems and servers." },
  { title: "Network Administrator", description: "Manages an organization's computer networks, ensuring connectivity, performance, and security." },
  { title: "Database Administrator (DBA)", description: "Responsible for the performance, integrity, and security of databases. Skills: SQL Server, Oracle, MySQL, PostgreSQL." },
  { title: "IT Project Manager", description: "Plans, executes, and closes IT projects, managing scope, budget, timeline, and team resources. Skills: Agile, Scrum, Waterfall." },
  { title: "Help Desk Technician", description: "Serves as the first point of contact for users seeking technical assistance, troubleshooting and resolving common IT problems." },
  { title: "Technical Writer", description: "Creates clear and concise technical documentation, such as user manuals, API guides, and online help systems." },

  // --- Core Engineering (Non-Software) ---
  { title: "Mechanical Design Engineer", description: "Designs and develops mechanical systems and components, using CAD software to create 3D models and engineering drawings." },
  { title: "Manufacturing Engineer", description: "Optimizes manufacturing processes and workflows to improve efficiency, reduce costs, and ensure product quality." },
  { title: "Quality Engineer (Mechanical)", description: "Ensures that manufactured products meet quality standards and specifications, implementing quality control procedures." },
  { title: "Electrical Design Engineer", description: "Designs and develops electrical systems, circuits, and components for various applications, from power distribution to electronics." },
  { title: "Instrumentation Engineer", description: "Specializes in the design and management of equipment used to monitor and control engineering systems and processes." },
  { title: "Civil Engineer", description: "Designs, constructs, and maintains infrastructure projects like roads, bridges, buildings, and water systems." },
  { title: "Structural Engineer", description: "Analyzes and designs the structural integrity of buildings, bridges, and other large structures to ensure they can withstand loads and stresses." },
  { title: "Chemical Engineer", description: "Designs and troubleshoots processes for the production, transformation, and transport of materials in industries like pharmaceuticals, petrochemicals, and food." },
  { title: "Process Engineer", description: "Focuses on optimizing industrial processes to ensure they are safe, efficient, and cost-effective, often in manufacturing or chemical plants." },
  { title: "Automotive Engineer", description: "Designs and develops vehicle systems and components, including engines, transmissions, and chassis." },
  { title: "Aerospace Engineer", description: "Designs, develops, and tests aircraft, spacecraft, and related systems and equipment." },
  { title: "Biomedical Engineer", description: "Applies engineering principles to healthcare, designing medical devices, artificial organs, and diagnostic equipment." },
  { title: "Environmental Engineer", description: "Develops solutions to environmental problems, such as water and air pollution control, waste management, and public health." },
  { title: "Marine Engineer", description: "Designs, builds, and maintains ships, boats, and offshore platforms, focusing on propulsion and power systems." },
  { title: "Materials Engineer", description: "Studies the properties and applications of various materials like metals, ceramics, and polymers to develop new products and improve existing ones." },
  { title: "Mining Engineer", description: "Designs and supervises the development of mines to safely and efficiently extract minerals and ores." },
  { title: "Petroleum Engineer", description: "Develops methods for extracting oil and gas from underground reservoirs, focusing on drilling and production." },
  { title: "Nuclear Engineer", description: "Works on the design, operation, and safety of systems and processes related to nuclear energy and radiation." },
  { title: "MEP (Mechanical, Electrical, Plumbing) Engineer", description: "Coordinates the design and installation of mechanical, electrical, and plumbing systems in buildings." },
  { title: "Renewable Energy Engineer", description: "Designs and implements energy systems using renewable sources like solar, wind, and hydro power." },
  { title: "Project Engineer (Core)", description: "Coordinates all technical and engineering aspects of a project, managing schedules, budgets, and resources." },
  { title: "Safety Engineer", description: "Develops and implements safety programs and procedures to minimize risks and ensure compliance with health and safety regulations." },
  { title: "CAD Technician", description: "Uses Computer-Aided Design (CAD) software to create precise technical drawings and plans for engineering and manufacturing projects." },

  // --- Legal & Law Firm Roles ---
  { title: "Legal Associate", description: "A lawyer with a few years of experience who works on client matters, drafts legal documents, and conducts research. Skills: Legal research, drafting, client management." },
  { title: "Senior Legal Associate", description: "An experienced lawyer who leads on cases and transactions, supervises junior associates, and has more client-facing responsibilities." },
  { title: "Litigation Associate", description: "A lawyer specializing in court proceedings. Skills: Court representation, drafting pleadings, arguing cases, evidence analysis." },
  { title: "Corporate Lawyer", description: "Advises businesses on legal matters such as mergers and acquisitions, corporate governance, contracts, and regulatory compliance." },
  { title: "Intellectual Property (IP) Lawyer", description: "Specializes in protecting and enforcing intellectual property rights, including patents, trademarks, and copyrights." },
  { title: "Legal Advisor / In-House Counsel", description: "Provides legal advice directly to a corporation, managing its legal affairs and mitigating risk from within." },
  { title: "Paralegal / Legal Executive", description: "Assists lawyers by drafting documents, conducting legal research, organizing case files, and managing client communication." },
  { title: "Corporate Paralegal", description: "Specializes in corporate matters, assisting with tasks like contract drafting, corporate governance, and ensuring compliance with the Companies Act, 2013." },
  { title: "Litigation Paralegal", description: "Assists attorneys in all stages of litigation, from case inception through discovery, trial, and post-trial procedures." },
  { title: "Legal Intern / Trainee Associate", description: "A law student or recent graduate gaining practical experience by assisting with legal research, drafting, and case preparation." },
  { title: "Partner (Law Firm)", description: "A senior lawyer who co-owns and manages a law firm, responsible for business development, client relations, and high-level case strategy." },
  { title: "Associate Partner (Law Firm)", description: "A senior-level lawyer on the path to partnership, who manages significant client relationships and complex matters." },
  { title: "Law Clerk / Judicial Clerk", description: "Assists a judge by researching legal issues, drafting opinions, and preparing for court proceedings." },
  { title: "Legal Transcriptionist", description: "Creates accurate written records of legal proceedings, such as court hearings and depositions, from audio recordings." },
  { title: "Compliance Officer (Legal)", description: "Ensures an organization adheres to all relevant laws, regulations, and internal policies to prevent legal and regulatory risk." },
  { title: "Contract Manager", description: "Manages the lifecycle of contracts for an organization, from negotiation and drafting to execution and renewal." },
  { title: "Mergers & Acquisitions (M&A) Lawyer", description: "Specializes in the legal aspects of buying, selling, and combining different companies." },
  { title: "Tax Lawyer", description: "Advises clients on complex tax laws and regulations, structuring transactions to minimize tax liabilities." },
  { title: "Arbitration Lawyer", description: "Represents clients in arbitration, a form of alternative dispute resolution outside of the court system." },
  { title: "Real Estate Lawyer", description: "Handles legal matters related to property transactions, including title searches, drafting deeds, and closing sales." },
  { title: "Cyber Law Specialist", description: "Focuses on legal issues related to the internet, digital technology, data privacy, and cybercrime." },

  // --- Chartered Accountancy & Finance ---
  { title: "Chartered Accountant (CA)", description: "Provides financial advice, audits accounts, and ensures financial compliance. Skills: Auditing, Taxation, Financial Reporting, Indian GAAP." },
  { title: "Article Assistant / Articled Trainee", description: "A trainee undergoing a three-year practical training under a practicing CA as part of the ICAI curriculum. Skills: Accounting, Auditing, Taxation, Compliance." },
  { title: "Semi-Qualified CA", description: "A professional who has completed the Intermediate level of CA but not the Final exam, assisting with accounting, tax, and audit tasks." },
  { title: "Audit Associate", description: "Assists in the audit of financial statements, performing tests of controls and substantive procedures under supervision." },
  { title: "Senior Auditor", description: "Leads audit engagements, plans audit procedures, supervises junior staff, and communicates findings to clients." },
  { title: "Tax Consultant (Direct & Indirect)", description: "Advises clients on income tax, GST, and other tax matters, helping with compliance and tax planning strategies." },
  { title: "Financial Analyst", description: "Examines financial data to guide business decisions and forecasting. Skills: Financial modeling, Excel, Forecasting, Variance analysis, Corporate finance." },
  { title: "Investment Banker", description: "Helps companies raise capital and provides strategic advisory services for mergers, acquisitions, and other major financial transactions." },
  { title: "Corporate Treasurer", description: "Manages an organization's financial risk, liquidity, and funding, overseeing cash management and corporate finance activities." },
  { title: "Cost Accountant / Cost and Management Accountant (CMA)", description: "Specializes in cost management, performance evaluation, and strategic financial planning for an organization." },
  { title: "Internal Auditor", description: "Provides independent, objective assurance on an organization's governance, risk management, and internal controls." },
  { title: "Forensic Accountant", description: "Investigates financial fraud and irregularities, using accounting and investigative skills to analyze complex financial data for litigation." },
  { title: "Insolvency Professional", description: "Licensed professional who handles the insolvency and bankruptcy resolution process under the Insolvency and Bankruptcy Code (IBC)." },
  { title: "Certified Financial Planner (CFP)", description: "Helps individuals create comprehensive financial plans to meet their life goals, covering investments, insurance, retirement, and taxes." },
  { title: "Wealth Manager", description: "Provides holistic financial advice and portfolio management services to high-net-worth individuals (HNIs) and families." },
  { title: "Equity Research Analyst", description: "Analyzes publicly traded companies and their stocks to provide investment recommendations (buy, hold, sell) to institutional clients." },
  { title: "Credit Analyst", description: "Evaluates the creditworthiness of individuals or businesses applying for loans or credit, assessing their ability to repay." },
  { title: "Risk Manager", description: "Identifies, assesses, and mitigates financial and operational risks for an organization, including market, credit, and liquidity risk." },
  { title: "Portfolio Manager", description: "Manages a portfolio of investments (stocks, bonds, etc.) on behalf of clients, making buy/sell decisions to achieve specific financial goals." },
  { title: "Fund Accountant", description: "Specializes in accounting for investment funds, such as mutual funds or hedge funds, calculating the Net Asset Value (NAV)." },
  { title: "Company Secretary (CS)", description: "Ensures a company complies with statutory and regulatory requirements, and manages corporate governance and board processes." },
  { title: "Accounts Payable / Receivable Specialist", description: "Manages a company's incoming payments (receivable) and outgoing bills (payable), ensuring timely and accurate processing." },
  { title: "Payroll Specialist", description: "Administers employee payroll, ensuring accurate calculation of wages, tax withholdings, and compliance with labor laws." },
  { title: "Finance Manager", description: "Oversees the financial operations of an organization, including budgeting, forecasting, financial reporting, and team management." },
  { title: "Chief Financial Officer (CFO)", description: "A senior executive responsible for managing all financial actions of a company, including financial planning, risk management, and financial reporting." },
  { title: "Treasury Analyst", description: "Supports the corporate treasury function by monitoring cash flow, managing bank relationships, and executing foreign exchange transactions." },
  { title: "FinTech Analyst", description: "Analyzes financial technologies and market trends to support product development and business strategy in the fintech sector." },
  { title: "RegTech Specialist", description: "Uses technology to help companies comply with regulations more efficiently and effectively, particularly in finance." },
  { title: "InsurTech Specialist", description: "Works at the intersection of insurance and technology, focusing on innovative products and digital distribution." },
  { title: "Blockchain Analyst (Finance)", description: "Analyzes blockchain data and applications for financial services, including cryptocurrencies and decentralized finance (DeFi)." },
  { title: "ESG Analyst (Finance)", description: "Evaluates companies and investments based on Environmental, Social, and Governance (ESG) criteria." },
  { title: "Valuation Analyst", description: "Determines the value of a business, asset, or intellectual property for various purposes, such as M&A, financial reporting, or taxation." },
  { title: "Trade Finance Specialist", description: "Manages financial instruments and products that facilitate international trade, such as letters of credit." },

  // --- Banking & Financial Services (BFSI) ---
  { title: "Relationship Manager (Banking)", description: "Manages relationships with high-value clients, offering personalized banking and financial advice. Skills: Client management, financial products, sales." },
  { title: "Branch Manager (Bank)", description: "Oversees all operations and staff at a bank branch, ensuring excellent customer service and achieving sales and profit targets." },
  { title: "Loan Officer", description: "Evaluates, authorizes, or recommends approval of loan applications for individuals and businesses." },
  { title: "Credit Manager (Banking)", description: "Assesses the creditworthiness of loan applicants and manages the bank's credit risk portfolio." },
  { title: "Bank Teller / Cashier", description: "Handles routine financial transactions for customers, such as deposits, withdrawals, and check cashing." },
  { title: "Investment Advisor", description: "Provides personalized investment advice and portfolio management services to individual and institutional clients." },
  { title: "Operations Manager (Banking)", description: "Oversees the daily operational activities of a bank branch or department, ensuring efficiency and compliance." },
  { title: "Branch Operations Manager", description: "Specifically manages the operational and administrative functions within a bank branch, including cash management and customer service." },
  { title: "Treasury Manager", description: "Manages a bank's own liquidity, funding, and financial risks." },
  { title: "Private Banker", description: "Provides highly personalized banking and wealth management services to ultra-high-net-worth individuals (UHNWIs)." },

  // --- Management & Strategy Consulting ---
  { title: "Strategy Consultant", description: "Advises top management on high-level strategic decisions, such as market entry, growth strategy, and organizational transformation." },
  { title: "Management Consultant", description: "Helps organizations improve their performance by analyzing existing business problems and developing plans for improvement." },
  { title: "Business Strategy Manager", description: "Develops and executes strategic initiatives within a company, often working with cross-functional teams." },
  { title: "Operations Consultant", description: "Specializes in improving the efficiency and effectiveness of an organization's operations, including supply chain and manufacturing." },
  { title: "Technology Consultant", description: "Advises clients on how to use technology to achieve their business objectives, from IT strategy to system implementation." },
  { title: "Human Capital Consultant", description: "Focuses on people-related strategies, including organizational design, talent management, and HR transformation." },
  { title: "Business Analyst (Consulting)", description: "Gathers requirements, analyzes data, and supports the development of solutions for consulting engagements." },
  { title: "Associate Consultant", description: "An entry-level role in consulting, supporting senior consultants with research, analysis, and presentation preparation." },
  { title: "Engagement Manager (Consulting)", description: "Leads a consulting project team, managing client relationships, project delivery, and team performance." },
  { title: "Partner (Consulting Firm)", description: "A senior leader in a consulting firm who manages key client relationships and drives business development." },

  // --- Human Resources (HR) & People Operations ---
  { title: "Human Resources (HR) Generalist", description: "Manages a variety of HR functions, including employee relations, benefits, and workplace policies." },
  { title: "Talent Acquisition Specialist / Recruiter", description: "Sources, screens, and hires candidates for open positions within an organization." },
  { title: "Technical Recruiter", description: "Specializes in sourcing and hiring technical talent for engineering and IT roles." },
  { title: "HR Business Partner (HRBP)", description: "Aligns HR strategy with business objectives, working closely with senior leadership to improve work culture and performance." },
  { title: "Compensation & Benefits (C&B) Specialist", description: "Designs and administers compensation, benefits, and total rewards programs." },
  { title: "Learning & Development (L&D) Manager", description: "Creates and implements training programs to enhance the skills and knowledge of employees." },
  { title: "HR Operations Specialist", description: "Manages the administrative and operational aspects of HR, including HR systems (HRIS), onboarding, and payroll support." },
  { title: "Employee Relations (ER) Manager", description: "Handles employee grievances, conflict resolution, and investigations into workplace issues." },
  { title: "Diversity, Equity, and Inclusion (DEI) Manager", description: "Develops and implements strategies to create a more diverse, equitable, and inclusive workplace." },
  { title: "Payroll Manager", description: "Oversees the entire payroll process, ensuring employees are paid accurately and on time, and that all tax and legal requirements are met." },

  // --- Marketing, Communications, & Design ---
  { title: "Marketing Specialist", description: "Develops and executes marketing campaigns across various channels. Skills: SEO, SEM, Content Marketing, Social Media, Google Analytics." },
  { title: "Digital Marketing Manager", description: "Leads an organization's digital marketing strategy, including online advertising, email marketing, and web analytics." },
  { title: "Social Media Manager", description: "Manages a brand's presence on social media platforms, creating content, engaging with followers, and running campaigns." },
  { title: "Content Marketing Manager", description: "Develops and executes a content strategy to attract and engage a target audience, often through blogs, articles, and videos." },
  { title: "SEO Specialist", description: "Optimizes website content and structure to improve organic search engine rankings. Skills: Keyword research, link building, technical SEO." },
  { title: "SEM / PPC Specialist", description: "Manages paid search advertising campaigns on platforms like Google Ads and Bing Ads." },
  { title: "Product Marketing Manager", description: "Responsible for the go-to-market strategy for a product, including positioning, messaging, and sales enablement." },
  { title: "Brand Manager", description: "Develops and maintains a brand's image, identity, and positioning in the market." },
  { title: "Public Relations (PR) Specialist", description: "Manages a brand's reputation and builds relationships with the media and public." },
  { title: "Corporate Communications Manager", description: "Manages internal and external communications for a company, including press releases, annual reports, and employee newsletters." },
  { title: "UI/UX Designer", description: "Designs user interfaces and optimizes the user experience. Skills: Figma, Adobe XD, Wireframing, Prototyping, User Research." },
  { title: "Graphic Designer", description: "Creates visual concepts to communicate ideas, using tools like Adobe Creative Suite (Photoshop, Illustrator, InDesign)." },
  { title: "Motion Graphics Designer", description: "Creates animated graphics and visual effects for video, web, and social media. Skills: After Effects, Premiere Pro." },
  { title: "Copywriter", description: "Writes clear, concise, and persuasive copy for advertisements, websites, and other marketing materials." },
  { title: "Art Director", description: "Oversees the visual style and imagery for a project or brand, leading a team of designers." },
  { title: "Creative Director", description: "Leads the creative vision for a brand or agency, guiding the development of all creative output." },

  // --- Media & Entertainment ---
  { title: "Video Editor", description: "Assembles raw footage into a finished product, adding music, sound effects, and graphics to create compelling video content." },
  { title: "Cinematographer / Director of Photography", description: "Responsible for the camera and lighting crews on a film set, creating the visual look and feel of a production." },
  { title: "Film Director", description: "Oversees the creative aspects of a film, guiding the actors and crew to realize their artistic vision." },
  { title: "Screenwriter", description: "Writes scripts for films, television shows, and web series." },
  { title: "Production Manager", description: "Oversees the business and logistical aspects of a film or TV production, managing budgets, schedules, and crew." },
  { title: "Sound Designer", description: "Creates and edits the audio elements for a film, game, or other production, including dialogue, sound effects, and ambient noise." },
  { title: "Journalist / Reporter", description: "Researches, writes, and reports news stories for newspapers, magazines, television, radio, or digital outlets." },
  { title: "Editor (Publishing)", description: "Reviews, edits, and shapes written content for publication, ensuring clarity, accuracy, and style." },
  { title: "Content Creator / Influencer", description: "Creates and publishes content on platforms like YouTube, Instagram, and TikTok to build an audience and engage with followers." },
  { title: "Digital Media Specialist", description: "Manages and creates content for an organization's digital media channels, including video, audio, and interactive media." },

  // --- Sales & Business Development ---
  { title: "Sales Executive / Account Executive", description: "Drives revenue by closing deals and managing client relationships. Skills: B2B Sales, CRM, Salesforce, Cold Calling, Negotiation." },
  { title: "Business Development Representative (BDR)", description: "Generates new business leads and pipelines for the sales team. Skills: Lead Generation, Outreach, Email Marketing, Prospecting." },
  { title: "Sales Manager", description: "Leads and manages a sales team, setting targets, coaching representatives, and developing sales strategies." },
  { title: "Key Account Manager", description: "Manages and grows relationships with a company's most important clients." },
  { title: "Inside Sales Representative", description: "Sells products or services remotely, typically via phone and email." },
  { title: "Field Sales Representative", description: "Meets with clients and prospects in person to sell products or services." },
  { title: "Pre-Sales Consultant / Solutions Engineer", description: "Works with the sales team to understand client technical requirements and demonstrate how a product or service can meet their needs." },
  { title: "Sales Operations Analyst", description: "Analyzes sales data, manages CRM systems, and improves sales processes to increase efficiency." },
  { title: "Partnerships Manager", description: "Identifies, develops, and manages strategic partnerships with other organizations to drive growth." },
  { title: "Channel Sales Manager", description: "Manages sales through indirect channels, such as resellers, distributors, and system integrators." },

  // --- Customer Success & Support ---
  { title: "Customer Success Manager", description: "Ensures clients achieve their goals using the product, reducing churn. Skills: Account Management, Onboarding, Retention, Client Relations." },
  { title: "Customer Support Representative", description: "Assists customers with questions and issues related to a product or service via phone, email, or chat." },
  { title: "Technical Support Engineer", description: "Provides advanced technical assistance to customers, troubleshooting complex software or hardware issues." },
  { title: "Onboarding Specialist", description: "Guides new customers through the initial setup and implementation of a product or service." },
  { title: "Customer Experience (CX) Manager", description: "Focuses on the entire customer journey, identifying and implementing improvements to increase satisfaction and loyalty." },

  // --- Product Management & Program Management ---
  { title: "Product Manager", description: "Leads product strategy, roadmapping, and works closely with engineering teams. Skills: Agile, Scrum, Jira, Roadmap planning, Technical translation." },
  { title: "Associate Product Manager (APM)", description: "An entry-level product management role, supporting senior PMs in executing the product roadmap." },
  { title: "Technical Product Manager", description: "A product manager with a strong technical background, often managing platform or infrastructure products." },
  { title: "Product Owner", description: "Responsible for defining user stories and prioritizing the team backlog in an Agile development environment." },
  { title: "Program Manager", description: "Coordinates and manages multiple related projects to achieve strategic business goals, often focusing on cross-functional alignment." },
  { title: "Project Manager", description: "Plans and executes specific projects within defined scope, budget, and timeline constraints." },
  { title: "Technical Program Manager (TPM)", description: "Manages large-scale, complex technical programs, bridging engineering, product, and business teams." },
  { title: "Scrum Master / Agile Coach", description: "Facilitates agile development processes and removes team blockers. Skills: Agile methodologies, Sprint planning, Kanban, Team leadership." },
  { title: "Release Manager", description: "Oversees the planning, scheduling, and coordination of software releases to production." },

  // --- Operations & Administration ---
  { title: "Operations Manager", description: "Oversees day-to-day operations to ensure business efficiency. Skills: Process optimization, Supply chain, Logistics, Budgeting, Team management." },
  { title: "Business Operations (BizOps) Manager", description: "Focuses on internal business operations, improving efficiency and alignment between departments." },
  { title: "Office Manager", description: "Manages the administrative functions of an office, including facilities, supplies, and support staff." },
  { title: "Executive Assistant (EA)", description: "Provides high-level administrative support to senior executives, managing schedules, communications, and travel." },
  { title: "Administrative Assistant", description: "Provides clerical and administrative support to a team or department." },
  { title: "Facilities Manager", description: "Manages the physical infrastructure of an organization, including buildings, utilities, and safety systems." },
  { title: "Vendor Manager", description: "Manages relationships with third-party vendors and suppliers, negotiating contracts and monitoring performance." },
  { title: "Process Excellence Manager", description: "Leads initiatives to improve business processes using methodologies like Lean, Six Sigma, and Kaizen." },

  // --- Supply Chain & Logistics ---
  { title: "Supply Chain Manager", description: "Oversees the entire supply chain process, from procurement of raw materials to delivery of finished goods to customers." },
  { title: "Logistics Coordinator", description: "Manages the day-to-day movement and storage of goods, coordinating shipments and managing inventory." },
  { title: "Procurement Specialist / Buyer", description: "Sources and purchases goods and services for an organization, negotiating with suppliers to get the best price and terms." },
  { title: "Inventory Manager", description: "Manages and optimizes inventory levels to meet customer demand while minimizing holding costs." },
  { title: "Warehouse Manager", description: "Oversees the operations of a warehouse, including receiving, storing, and shipping goods." },
  { title: "Demand Planner", description: "Forecasts future product demand to help the organization optimize inventory and production planning." },
  { title: "Fleet Manager", description: "Manages a company's fleet of vehicles, ensuring maintenance, compliance, and efficient operation." },
  { title: "Customs Compliance Specialist", description: "Ensures that all import and export activities comply with customs regulations and trade laws." },
  { title: "Material Planner", description: "Ensures the right amount of raw materials and components are available for production to meet demand." },

  // --- Retail & E-commerce ---
  { title: "Store Manager (Retail)", description: "Manages the daily operations of a retail store, including staff, sales, inventory, and customer service." },
  { title: "E-commerce Manager", description: "Manages the online sales operations of a business, including website management, digital marketing, and online customer service." },
  { title: "Merchandiser", description: "Plans and manages the buying and displaying of products in a retail store to maximize sales." },
  { title: "E-commerce Specialist", description: "Focuses on specific aspects of e-commerce, such as product listing, online marketing, or order fulfillment." },
  { title: "Category Manager (Retail)", description: "Manages a specific product category, responsible for pricing, promotion, and assortment planning to meet sales targets." },
  { title: "Visual Merchandiser", description: "Creates attractive visual displays in retail stores to engage customers and promote sales." },
  { title: "Customer Service Associate (Retail)", description: "Assists customers in a store, answering questions, processing transactions, and resolving issues." },
  { title: "Catalog Associate / Executive", description: "Manages and maintains the online product catalog for an e-commerce website, ensuring accurate and complete product information." },

  // --- Real Estate & Construction ---
  { title: "Real Estate Agent / Broker", description: "Facilitates the buying, selling, and renting of properties on behalf of clients." },
  { title: "Construction Project Manager", description: "Plans and oversees construction projects from start to finish, managing budgets, timelines, and subcontractors." },
  { title: "Architect", description: "Designs buildings and other structures, considering aesthetics, functionality, and safety." },
  { title: "Interior Designer", description: "Designs interior spaces, selecting furnishings, colors, and layouts to create functional and aesthetically pleasing environments." },
  { title: "Quantity Surveyor", description: "Manages all costs relating to building and civil engineering projects, from initial estimates to final figures." },
  { title: "Property Manager", description: "Manages the day-to-day operations of a residential or commercial property on behalf of the owner." },
  { title: "Leasing Consultant", description: "Works with property owners and managers to find and qualify tenants for rental properties." },
  { title: "Site Engineer (Civil)", description: "Manages the technical and engineering aspects of a construction site, ensuring work is done according to plans and specifications." },

  // --- Healthcare & Pharmaceuticals ---
  { title: "Doctor / Physician", description: "Diagnoses and treats illnesses and injuries in patients. Various specializations exist." },
  { title: "Registered Nurse (RN)", description: "Provides and coordinates patient care, educates patients about health conditions, and offers emotional support." },
  { title: "Pharmacist", description: "Dispenses prescription medications to patients and provides advice on their safe and effective use." },
  { title: "Medical Laboratory Technician", description: "Performs laboratory tests on patient samples to help diagnose and treat diseases." },
  { title: "Radiologist", description: "Uses medical imaging technologies (X-ray, MRI, CT) to diagnose and sometimes treat diseases." },
  { title: "Physiotherapist", description: "Helps patients recover from injuries and illnesses by improving their movement and managing pain." },
  { title: "Dietitian / Nutritionist", description: "Advises patients on healthy eating habits and develops personalized nutrition plans." },
  { title: "Healthcare Administrator", description: "Manages the business operations of a healthcare facility, such as a hospital or clinic." },
  { title: "Medical Coder", description: "Translates medical diagnoses and procedures into standardized codes for billing and insurance purposes." },
  { title: "Pharmaceutical Sales Representative", description: "Promotes and sells pharmaceutical products to healthcare professionals, such as doctors and pharmacists." },
  { title: "Clinical Research Associate (CRA)", description: "Monitors clinical trials to ensure they are conducted in accordance with regulations and protocols." },
  { title: "Veterinarian", description: "Diagnoses and treats diseases and injuries in animals. An emerging, fast-growing career in India." },

  // --- Education & Academia ---
  { title: "Teacher (Primary/Secondary)", description: "Educates students in a specific subject area, develops lesson plans, and assesses student progress." },
  { title: "Professor / Lecturer (Higher Education)", description: "Teaches undergraduate and graduate students at a college or university, and conducts research in their field." },
  { title: "Academic Counselor", description: "Provides guidance to students on academic, career, and personal matters." },
  { title: "Instructional Designer", description: "Creates engaging and effective learning experiences and course materials, often for online education." },
  { title: "Learning Experience Designer (AI-Driven)", description: "Creates adaptive, AI-powered learning journeys that personalize content and retain human mentoring." },
  { title: "Principal / Headmaster", description: "Provides leadership and administrative oversight for a school." },
  { title: "Special Education Teacher", description: "Works with students who have a wide range of learning, mental, emotional, and physical disabilities." },
  { title: "Education Technology (EdTech) Specialist", description: "Implements and supports the use of technology in the classroom to enhance teaching and learning." },
  { title: "Librarian", description: "Manages a library's collection of resources and helps patrons find information." },
  { title: "Research Assistant", description: "Assists a professor or research team with academic or scientific research." },


  // --- Travel, Hospitality, & Tourism ---
  { title: "Hotel Manager", description: "Oversees the daily operations of a hotel, ensuring guest satisfaction and managing staff." },
  { title: "Travel Agent / Consultant", description: "Helps clients plan and book travel arrangements, including flights, hotels, and tours." },
  { title: "Chef", description: "Oversees the culinary operations of a restaurant or hotel kitchen, creating menus and managing staff." },
  { title: "Restaurant Manager", description: "Manages the operations of a restaurant, including front-of-house and back-of-house activities." },
  { title: "Event Planner", description: "Organizes and coordinates events such as weddings, conferences, and corporate parties." },
  { title: "Cabin Crew / Flight Attendant", description: "Ensures the safety and comfort of passengers aboard an aircraft." },
  { title: "Tour Guide", description: "Leads individuals or groups on tours, providing information about historical, cultural, or natural sites." },
  { title: "Guest Relations Executive", description: "Ensures a positive experience for hotel guests, addressing their needs and resolving any issues." },

  // --- Emerging & Future-Facing Roles ---
  { title: "Forward Deployed Engineer (FDE)", description: "Works directly with clients on-site to implement and customize technical solutions, especially AI products." },
  { title: "Climate Risk Analyst", description: "Assesses the financial and operational impact of climate change on organizations and assets." },
  { title: "Sustainability Manager", description: "Develops and implements strategies to reduce an organization's environmental footprint and improve sustainability." },
  { title: "Renewable Energy Consultant", description: "Advises businesses and governments on the adoption and integration of renewable energy sources." },
  { title: "Drone Pilot / Operator", description: "Operates unmanned aerial vehicles (UAVs) for various applications, including photography, surveying, and delivery." },
  { title: "Podcast Producer", description: "Manages the production of a podcast, from recording and editing to publishing and promotion." },

  // --- VLSI & Semiconductor ---
  { title: "VLSI Design Engineer", description: "Designs and develops Very-Large-Scale Integration (VLSI) circuits and chips. Skills: Verilog, VHDL, SystemVerilog, RTL Design, ASIC/FPGA design flow, synthesis, timing analysis, and semiconductor physics." },
  { title: "ASIC Physical Design Engineer", description: "Implements the physical layout of Application-Specific Integrated Circuits (ASICs), from RTL to GDSII. Skills: Place and Route (PnR), timing closure (STA), power analysis, and physical verification (DRC/LVS)." },
  { title: "Design Verification Engineer", description: "Verifies and validates the functionality and performance of digital circuits and SoCs. Skills: SystemVerilog, UVM (Universal Verification Methodology), testbench development, functional coverage, and debugging." },
  { title: "RTL Design Engineer", description: "Designs digital circuits at the Register-Transfer Level (RTL). Skills: Verilog, SystemVerilog, microarchitecture, FSM design, CDC (Clock Domain Crossing), and linting tools." },
  { title: "FPGA Design Engineer", description: "Designs and implements digital logic on Field-Programmable Gate Arrays (FPGAs). Skills: VHDL/Verilog, Xilinx Vivado, Intel Quartus, high-level synthesis (HLS), and hardware debugging." },
  { title: "Analog/Mixed-Signal (AMS) Design Engineer", description: "Designs analog circuits and integrates them with digital blocks on a single chip. Skills: CMOS circuit design, Op-Amps, data converters (ADC/DAC), PLLs, and Cadence Virtuoso." },
  { title: "Design for Testability (DFT) Engineer", description: "Implements test structures into chip designs to ensure they can be efficiently tested post-manufacturing. Skills: Scan insertion, ATPG (Automatic Test Pattern Generation), JTAG, BIST, and fault simulation." },
  { title: "IC Layout Engineer", description: "Creates the physical layout and mask designs for integrated circuits. Skills: Cadence Virtuoso Layout Suite, Calibre DRC/LVS, analog layout techniques, and deep submicron node understanding." },
  { title: "SoC (System-on-Chip) Architect", description: "Defines the high-level architecture of a System-on-Chip, integrating various IP blocks like CPUs, GPUs, and memory controllers. Skills: System architecture, performance modeling, and IP integration." },

  // --- Embedded Systems & Firmware ---
  { title: "Embedded Systems Engineer", description: "Develops integrated hardware and software systems for a dedicated function within a larger mechanical or electrical system. Skills: Microcontrollers, ARM Cortex, RTOS, C/C++, I2C, SPI, UART." },
  { title: "Firmware Engineer", description: "Develops the low-level software that directly controls and communicates with hardware. Skills: C, C++, Assembly, device drivers, bootloaders, communication protocols (I2C, SPI, CAN), and real-time operating systems (RTOS)." },
  { title: "Embedded Linux Developer", description: "Develops and customizes the Linux operating system for embedded hardware. Skills: Linux kernel, device drivers, Yocto Project, Buildroot, bootloaders (U-Boot), and debugging." },
  { title: "IoT Firmware Engineer", description: "Develops embedded firmware for Internet of Things (IoT) devices, focusing on connectivity and low-power operation. Skills: C, C++, FreeRTOS, MQTT, BLE, Wi-Fi, LoRa, and power management." },

  // --- Hardware & PCB Design ---
  { title: "Electronics Hardware Design Engineer", description: "Designs and develops electronic circuits and systems for various applications. Skills: Analog and digital circuit design, schematic capture, component selection, prototyping, and troubleshooting." },
  { title: "PCB Layout Engineer", description: "Designs the physical layout of Printed Circuit Boards (PCBs). Skills: Altium Designer, Cadence Allegro, KiCad, high-speed routing, signal integrity, power integrity, and EMI/EMC considerations." },
  { title: "Hardware Validation Engineer", description: "Tests and validates electronic hardware to ensure it meets design specifications and reliability standards. Skills: Lab equipment (oscilloscopes, DMMs, spectrum analyzers), test automation, and debugging." },
  { title: "Power Electronics Engineer", description: "Designs and develops circuits and systems for power conversion and management. Skills: Power supply design (AC-DC, DC-DC), inverters, converters, motor drives, and thermal management." },

  // --- RF & Communication ---
  { title: "RF Design Engineer", description: "Designs and develops Radio Frequency (RF) circuits and systems for wireless communication. Skills: RF circuit design, antennas, impedance matching, S-parameters, and simulation tools like ADS or HFSS." },
  { title: "RF Test Engineer", description: "Tests and characterizes RF components and systems. Skills: RF test equipment (VNA, Spectrum Analyzer, Signal Generator), calibration, and automation." },
  { title: "Telecommunication Engineer", description: "Designs, installs, and maintains telecommunication systems and networks. Skills: Fiber optics, IP/MPLS, wireless communication (GSM, LTE, 5G), and network architecture." },

  // --- Testing & Validation ---
  { title: "Test Development Engineer (Electronics)", description: "Develops automated test equipment (ATE) and test programs for semiconductor and electronic product manufacturing. Skills: ATE platforms (e.g., Advantest, Teradyne), programming (C++, Python), and hardware debugging." },
  { title: "Silicon Validation Engineer", description: "Validates the functionality and performance of new silicon chips in a post-silicon lab environment. Skills: Lab equipment, scripting (Python, Perl), and system-level debugging." },
  { title: "ATE (Automated Test Equipment) Engineer", description: "Designs, develops, and maintains automated test equipment for high-volume production testing of electronics. Skills: ATE hardware/software, test program development, and yield analysis." },

  // --- Specialized & Emerging Fields ---
  { title: "Signal Integrity Engineer", description: "Analyzes and ensures the quality of electrical signals in high-speed digital systems. Skills: Signal and power integrity analysis, IBIS models, S-parameters, and tools like Ansys HFSS or Cadence Sigrity." },
  { title: "MEMS Engineer", description: "Designs and develops Micro-Electro-Mechanical Systems (MEMS) like sensors and actuators. Skills: Microfabrication, semiconductor physics, mechanical design, and simulation." }
];


async function generateEmbedding(text) {
  const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
  const result = await model.embedContent({
    content: { parts: [{ text: text }] }, 
    taskType: TaskType.RETRIEVAL_DOCUMENT
  });
  return result.embedding.values;
}

// Helper function to pause execution
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB...");

    // 🧹 Master Cleanup
    console.log("🧹 Commencing full database wipe...");
    await Role.deleteMany({});
    
    // Optional: Wipe other collections if you imported them
    // await Resume.deleteMany({});
    // await Company.deleteMany({});
    
    console.log("✨ Database is spotless. Starting fresh seed...\n");

    let count = 1;

    for (const role of popularRoles) {
      console.log(`[${count}/${popularRoles.length}] Processing: ${role.title}...`);

      const textToEmbed = `${role.title}. ${role.description}`;
      
      let vectorArray = null;
      let success = false;
      let attempts = 0;

      // 🔄 AUTOMATIC RETRY LOGIC
      while (!success && attempts < 3) {
        try {
          vectorArray = Array.from(await generateEmbedding(textToEmbed));
          success = true;
        } catch (err) {
          attempts++;
          console.log(`   ⚠️ Network hiccup from Google API. Retrying in 5 seconds... (Attempt ${attempts}/3)`);
          await sleep(5000); // Wait 5 seconds before retrying
        }
      }

      if (!success) {
        console.error(`❌ Failed to process ${role.title} after 3 attempts. Skipping to next...`);
        count++;
        continue; // Skip this one and keep going so the script doesn't crash!
      }

      const newRole = new Role({
        title: role.title,
        description: role.description,
        embedding: vectorArray,
      });
      await newRole.save();

      // 🐢 THE SPEED LIMIT: Wait 4 seconds between requests to respect the 15 RPM free tier limit
      await sleep(4000); 
      count++;
    }

    console.log("\n🎉 Seeding complete! MongoDB Atlas is locked and loaded.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error during seeding:", err);
    process.exit(1);
  }
}

seedDatabase();