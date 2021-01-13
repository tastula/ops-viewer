import React, { useEffect, useState } from 'react';
import courseData from './res/newCourses.json';
import Tree from 'react-d3-tree';
import { CourseUnit, CourseUnitSubstitution, PrerequisiteGroup } from './models';
import { RawNodeDatum } from 'react-d3-tree/lib/types/common';

// Make sure only currently available courses appear
const cleanedCourseData: CourseUnit[] = (courseData as CourseUnit[]).filter((course: CourseUnit) => {
  return course.curriculumPeriodIds.some((curriculum: string) => curriculum.includes('2020'));
});

// Index courses by both internal groupId and known course code
const indexedCourses = new Map<string, CourseUnit>();
cleanedCourseData.forEach((course) => {
  indexedCourses.set(course.groupId, course);
  indexedCourses.set(course.code, course);
});

// List of available course codes
const courseCodes = cleanedCourseData.map((course) => course.code);

const preferEnglish: boolean = true;
const selectName = (course: CourseUnit, english: boolean = preferEnglish): string => {
  if(english) return course.name.en ?? course.name.fi ?? 'error';
  return course.name.fi ?? course.name.en ?? 'error';
};

const createNodesForCourse = (preGroup: PrerequisiteGroup, compulsory: boolean = true): RawNodeDatum[] | undefined => {
  return preGroup.prerequisites.map((prerequisite) => {
    // Course, continue recursion
    if(prerequisite?.courseUnitGroupId) {
      const course = indexedCourses.get(prerequisite.courseUnitGroupId);
      if(course) {
        const preGroups = createNodesForPreGroup(course);
        return {
          name: selectName(course),
          children: preGroups?.length === 1 ? preGroups[0].children : preGroups,
          attributes: {
            type: compulsory ? 'compulsory' : 'optional',
          }
        }
      }
    }
    // Study module or error
    return {
      name: prerequisite.moduleGroupId ?? 'error',
    };
  })
};

const createNodesForPreGroup = (course: CourseUnit): RawNodeDatum[] | undefined => {
  const compulsory = course.compulsoryFormalPrerequisites?.map((preGroup, idx) => {
    return {
      name: `Group C${idx + 1}`,
      children: createNodesForCourse(preGroup),
      attributes: {
        type: 'compulsory',
      }
    };
  }) ?? [];
  const recommended = course.recommendedFormalPrerequisites?.map((preGroup, idx) => {
    return {
      name: `Group O${idx + 1}`,
      children: createNodesForCourse(preGroup, false),
      attributes: {
        type: 'optional',
      }
    };
  }) ?? [];

  return compulsory.concat(recommended);
};

const createNodes = (courseCode: string): RawNodeDatum => {
  const course = indexedCourses.get(courseCode);
  if(course) {
    const preGroups = createNodesForPreGroup(course);
    return {
      name: selectName(course),
      children: preGroups?.length === 1 ? preGroups[0].children : preGroups,
    }
  }
  return emptyTree;
};

const emptyTree: RawNodeDatum = { name: 'No data'};

function App() {
  const [currentCourse, setCurrentCourse] = useState<string>('COMP.CS.350');
  const [nodeData, setNodeData] = useState<RawNodeDatum>(emptyTree);

  useEffect(() => {
    setNodeData(createNodes(currentCourse));
  }, [currentCourse]);

  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <div style={{ width: '80vw', height: '100vh'}}>
        <Tree data={nodeData} pathFunc="step" orientation="vertical" translate={{x: 800, y: 200}}/>
      </div>
      <div style={{ flexGrow: 1, height: '100vh', overflowY: 'scroll' }}>
        <ul>
          {courseCodes.map((code: string, idx: number) => (
            <li key={idx} onClick={() => setCurrentCourse(code)}>{code}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;
