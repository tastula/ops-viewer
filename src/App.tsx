import React, { useEffect, useState } from 'react';
import courseData from './res/tieCourses.json';
import Tree from 'react-d3-tree';
import { CourseUnit, PrerequisiteGroup } from './models';
import { RawNodeDatum } from 'react-d3-tree/lib/types/common';
import FormControl from 'react-bootstrap/FormControl';
import InputGroup from 'react-bootstrap/InputGroup';
import ListGroup from 'react-bootstrap/ListGroup';

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
const selectName = (course: CourseUnit | undefined, english: boolean = preferEnglish): string => {
  if(course) {
    if(english) return course.name.en ?? course.name.fi ?? 'error';
    return course.name.fi ?? course.name.en ?? 'error';
  }
  return 'error';
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
      name: prerequisite.moduleGroupId ?? 'no data',
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
  const [searchWord, setSearchWord] = useState<string>('');
  const [nodeData, setNodeData] = useState<RawNodeDatum>(emptyTree);

  useEffect(() => {
    setNodeData(createNodes(currentCourse));
  }, [currentCourse]);

  const courseSearch = (): JSX.Element => (
    <InputGroup style={{ padding: '12px' }}>
      <FormControl
        type="text"
        value={searchWord}
        placeholder="Search"
        onChange={(event) => setSearchWord(event.target.value)}
      />
    </InputGroup>
  );

  const courseName = (): JSX.Element => (
    <h1>{currentCourse} {selectName(indexedCourses.get(currentCourse))}</h1>
  );

  const courseList = (): JSX.Element => (
    <ListGroup>
      {courseCodes
        .filter((code) => code.toLowerCase().includes(searchWord.toLowerCase()))
        .map((code: string, idx: number) => (
          <ListGroup.Item variant="light" action active={code === currentCourse} key={idx} onClick={() => setCurrentCourse(code)}>
            {code}
          </ListGroup.Item>
        ))
      }
    </ListGroup>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <div style={{ display: 'flex', flexDirection: 'column', width: '400px', height: '100vh' }}>
        {courseSearch()}
        <div style={{ flexGrow: 1, overflowY: 'scroll' }}>
          {courseList()}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, height: '100vh', margin: '12px' }}>
        {courseName()}
        <div style={{ flexGrow: 1, borderWidth: 4 }}>
          <Tree data={nodeData} pathFunc="step" orientation="vertical" translate={{x: 800, y: 200}}/>
        </div>
      </div>
    </div>
  );
}

export default App;
