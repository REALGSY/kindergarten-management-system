<script setup>
import { computed } from "vue";
import { GraduationCap, UserRound, UsersRound } from "lucide-vue-next";
import ResourceView from "./ResourceView.vue";

const props = defineProps({
  userType: { type: String, default: "students" },
});

const userSections = {
  students: {
    label: "学生",
    icon: GraduationCap,
    to: "/admin_dashboard/users/students",
    config: {
      title: "学生档案",
      endpoint: "/admin/students",
      fields: ["first_name", "second_name", "surname", "admission_number", "age", "description", "classroom_id"],
    },
  },
  parents: {
    label: "家长",
    icon: UsersRound,
    to: "/admin_dashboard/users/parents",
    config: {
      title: "家长档案",
      endpoint: "/admin/parents",
      fields: ["first_name", "last_name", "phone_number", "email", "password"],
    },
  },
  teachers: {
    label: "教师",
    icon: UserRound,
    to: "/admin_dashboard/users/teachers",
    config: {
      title: "教师档案",
      endpoint: "/admin/teachers",
      fields: ["first_name", "last_name", "career_name", "email", "phone_number", "gender", "password"],
    },
  },
};

const activeType = computed(() => userSections[props.userType] ? props.userType : "students");
const activeSection = computed(() => userSections[activeType.value]);
</script>

<template>
  <div>
    <div class="page-heading user-management-heading">
      <div>
        <span class="mono-label">ADMIN / USER MANAGEMENT</span>
        <h1>用户管理</h1>
        <p>统一维护园所学生、家长与教师账号。</p>
      </div>
    </div>

    <nav class="user-type-tabs" aria-label="用户类型">
      <RouterLink
        v-for="(section, key) in userSections"
        :key="key"
        :to="section.to"
        class="user-type-tab"
        :class="{ active: activeType === key }"
        :aria-current="activeType === key ? 'page' : undefined"
      >
        <component :is="section.icon" :size="18" :stroke-width="1.8" />
        <span>{{ section.label }}</span>
      </RouterLink>
    </nav>

    <ResourceView :key="activeType" role="admin" :config="activeSection.config" embedded />
  </div>
</template>

<style scoped>
.user-management-heading {
  margin-bottom: 18px;
}

.user-type-tabs {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  min-height: 58px;
  margin-bottom: 20px;
  padding: 4px;
  border: 1px solid var(--line-dark);
  border-radius: var(--radius-sm);
  background: rgba(7, 23, 37, .72);
}

.user-type-tab {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  justify-content: center;
  gap: 9px;
  padding: 10px 14px;
  border: 1px solid transparent;
  border-radius: 6px;
  color: var(--muted-dark);
  font-size: 13px;
  font-weight: 700;
  transition: color .18s ease, background .18s ease, border-color .18s ease;
}

.user-type-tab:hover {
  color: #e9faff;
  background: rgba(77, 228, 211, .06);
}

.user-type-tab.active {
  color: #06282d;
  border-color: rgba(77, 228, 211, .5);
  background: var(--cyan);
  box-shadow: 0 8px 20px rgba(19, 184, 198, .14);
}

.user-type-tab:focus-visible {
  outline: 3px solid rgba(77, 228, 211, .42);
  outline-offset: 2px;
}

@media (max-width: 600px) {
  .user-type-tabs {
    min-height: 52px;
  }

  .user-type-tab {
    gap: 6px;
    padding: 9px 7px;
  }
}
</style>
