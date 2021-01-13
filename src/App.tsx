import React from 'react';
import './App.css';
import tieCourses from './res/tieCourses.json';
import { CourseUnit, PrerequisiteGroup } from './models';

// Make courses available by both internal groupId and known course code
const indexedCourses = new Map<string, CourseUnit>();
tieCourses.forEach((course) => {
  indexedCourses.set(course.groupId, course);
  indexedCourses.set(course.code, course);
});

interface CourseTreeNode {
  id: string;
  text_1: string;
  father: string | null;
}

const nodes: CourseTreeNode[] = [];

const createNodesForCourse = (preGroup: PrerequisiteGroup, preGroupId: string) => {
  preGroup.prerequisites.forEach((prerequisite) => {
    // TODO: Support also study modules
    if(prerequisite?.courseUnitGroupId) {
      const course = indexedCourses.get(prerequisite.courseUnitGroupId);
      if(course) {
        nodes.push({
          id: course.code,
          text_1: course.name.fi ?? course.name.en ?? 'error',
          father: preGroupId,
        });
        createNodesForPreGroup(course);
      }
    }
  })
};

const createNodesForPreGroup = (course: CourseUnit) => {
  course.compulsoryFormalPrerequisites?.forEach((preGroup, idx) => {
    if(preGroup.prerequisites.length !== 0) {
      const preGroupId = `${course.code}preGroup${idx + 1}`;
      nodes.push({
        id: preGroupId,
        text_1: `Group ${idx}`,
        father: course.code,
      });
      createNodesForCourse(preGroup, preGroupId);
    }
  });
};

const createNodes = (courseCode: string) => {
  const course = indexedCourses.get(courseCode);
  if(course) {
    nodes.push({
      id: course.code,
      text_1: course.name.fi ?? course.name.en ?? 'error',
      father: null,
    });
    createNodesForPreGroup(course);
  }
};

createNodes("COMP.CS.140");
console.log(nodes);

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <p>
          {tieCourses.length}
        </p>
      </header>
    </div>
  );
}

export default App;
