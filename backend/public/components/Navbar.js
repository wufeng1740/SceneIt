export default {
  template: `
    <nav class="navbar">
      <div class="left">
        <a href="/" class="logo_container">
          <img :src="logoSrc" alt="SceneIt logo" class="logo" />
          <h2 class="logo_text">SceneIt</h2>
        </a>
      </div>
      <div class="right">
        <a href="./search.html" class="icon-link icon">
          <span class="icon material-symbols-outlined">search</span>
          <p>search</p>
        </a>
        <a href="./discover.html" class="icon-link icon">
          <span class="icon material-symbols-outlined">explore</span>
          <p>discover</p>
        </a>
        <a href="#dark" class="icon-link icon" @click.prevent="toggleDark">
          <span class="icon material-symbols-outlined">{{ themeIcon }}</span>
          <p>theme</p>
        </a>
        <a v-if="usernameFromCookie" @click="redirectToAccount" href="#" class="icon-link icon">
          <img src=https://api.dicebear.com/9.x/pixel-art/svg/>
          <p>{{usernameFromCookie}}</p>
        </a>
        <a v-else href="./login.html" class="icon-link icon">
          <span class="icon material-symbols-outlined">account_circle</span>
          <p>account</p>
        </a>
      </div>
    </nav>
  `,
  data() {
    return {
      logoSrc: "./images/logo_light-mode.png",
      themeIcon: "dark_mode",
    };
  },
  methods: {
    toggleDark() {
      document.body.classList.toggle("dark");
      const isDark = document.body.classList.contains("dark");
      localStorage.setItem("isDark", isDark);
      this.logoSrc = isDark
        ? "./images/logo_dark-mode.png"
        : "./images/logo_light-mode.png";
      this.themeIcon = isDark ? "light_mode" : "dark_mode";
    },
    redirectToAccount() {
      window.location.href = "./account.html";
    },
    async logout() {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: 'include',
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        this.responseMsg = `${response.status}: ${response.statusText}`;
      }

      const msg = await response.json();

      console.log(msg.message)
      window.location.replace('/index.html');
    },
},
computed: {
  usernameFromCookie() {
    const getCookie = (name) => {
      if (!document.cookie) return undefined;

      if (document.cookie.match(name)) {
        return document.cookie
          .split("; ")
          .find((kv) => kv.startsWith(name + "="))
          ?.split("=")[1];
      }
    };

    return getCookie("username");
  },
},
mounted() {
  const isDarkStored = localStorage.getItem("isDark") === "true";
  if (isDarkStored) {
    document.body.classList.add("dark");
    this.logoSrc = "./images/logo_dark-mode.png";
    this.themeIcon = "light_mode";
  }
},
};
