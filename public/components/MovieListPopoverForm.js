import BaseInput from "./BaseInput.js";

export default {
  components: {
    BaseInput,
  },
  props: {
    modelValue: String,
    id: String,
    title: String,
    username: String,
    inputMode: String,
    selectedList: [Object],
  },
  emits: ["listAdded", "listUpdated"],
  data() {
    return {
      popoverShowing: false,
      listDetails: {
        name: "",
        description: "",
      },
    };
  },
  async mounted() {
    document.body.appendChild(this.$refs.popoverBg);

    if (this.inputMode === "edit") {
      this.listDetails = { ...this.selectedList };
    }
  },
  watch: {
    selectedList(newList) {
      this.listDetails = { ...newList };
    },
  },
  methods: {
    handleListChange() {
      if (this.inputMode === "add") {
        this.addList();
      } else if (this.inputMode === "edit") {
        this.editList();
      }
    },
    async addList() {
      try {
        // Add a new list then update the rendered list
        const newList = {
          list_name: this.listDetails.name,
          list_description: this.listDetails.description,
        };

        const response = await fetch("/api/lists/add", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newList),
        });

        if (!response.ok) {
          const { error } = await response.json();
          throw new Error(error);
        }
        const data = await response.json();

        this.$emit("listAdded", { list_id: data.list_id, ...this.listDetails });
        showToast("List added successfully", "success");
        this.listDetails.name = "";
        this.listDetails.description = "";
        this.$refs.listPopover.hidePopover();
      } catch (err) {
        showToast(err, "error");
      }
    },
    async editList() {
      try {
        // Add a new list then update the rendered list
        const updatedList = {
          list_name: this.listDetails.name,
          list_description: this.listDetails.description,
        };

        const response = await fetch(`/api/lists/update/${this.listDetails.list_id}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedList),
        });

        if (!response.ok) {
          const { error } = await response.json();
          throw new Error(error);
        }
        const data = await response.json();

        if (data.success) {
          this.$emit("listUpdated", this.listDetails);
          showToast("List updated successfully", "success");
        }
        this.$refs.listPopover.hidePopover();
      } catch (err) {
        showToast(err, "error");
      }
    },
    cancelListChange() {
      if (this.inputMode === "add") {
        this.listDetails.name = "";
        this.listDetails.description = "";
      }
      this.$refs.listPopover.hidePopover();
    },
  },
  template: `
    <dialog 
      popover 
      ref="listPopover"
      :id="id" 
      @toggle="e => popoverShowing = (e.newState === 'open')"
      class="movie-list-form-container"> 
      <form id="add-list-form" @submit.prevent>
        <h3>{{ title }}</h3>
        <base-input label="Name" id="list-name" type="text" v-model="listDetails.name"></base-input>
        <base-input label="Description" id="list-description" type="text" v-model="listDetails.description"></base-input>
        <div class="button-row">
          <button @click="cancelListChange()" class="btn-ghost">Cancel</button>
          <button @click="handleListChange()" class="btn-primary">{{ this.inputMode === 'add' ? "Add List" : "Edit List" }}</button>
        </div>
      </form>
    </dialog>
    <div ref="popoverBg" class="popover-bg" v-show="popoverShowing"></div>
  `,
};
